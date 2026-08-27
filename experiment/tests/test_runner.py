from __future__ import annotations

import asyncio
import json
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path
from typing import Any

import httpx

from kumamoto_real_response.backend import Backend, PLAIN_READER_SCHEMA, TOP_P
from kumamoto_real_response.graph import compile_evidence_table
from kumamoto_real_response.manifest import _identity, configs, create, validate
from kumamoto_real_response.run import _write_result, run_config, validate_result_dir
from kumamoto_real_response.scenario import ARM_IDS, indexes, load_scenario, role_packet, safe_slot_packet
from kumamoto_real_response.scoring import score_decision
from kumamoto_real_response.util import sha256_file


def valid_decision(scenario: dict[str, Any], slot_id: str) -> dict[str, Any]:
    slot = indexes(scenario)["slots"][slot_id]
    count = int(slot["action_contract"]["minimum_assignments"])
    target_id = slot["eligible_target_ids"][0]
    assignments = []
    for index in range(count):
        resource_id = slot["eligible_resource_ids"][
            0 if slot["action_contract"]["allow_resource_reuse"] else index
        ]
        assignments.append({"resource_id": resource_id, "target_id": target_id, "quantity": 1})
    observation_id = slot["visible_observation_ids"][0]
    return {
        "assignments": assignments,
        "used_observation_ids": [observation_id],
        "acknowledged_unknown_ids": list(slot["required_unknown_ids"]),
        "decision_factors": [{"observation_id": observation_id, "role": "SUPPORTS"}],
        "short_reason": "A bounded decision using only the named current observation.",
    }


class FakeBackend:
    base_url = "fake://local"

    def __init__(self, scenario: dict[str, Any], *, fault_initial_evidence: bool = False) -> None:
        self.scenario = scenario
        self.fault_initial_evidence = fault_initial_evidence

    async def chat(
        self,
        *,
        role: str,
        messages: list[dict[str, str]],
        request_seed: int,
        request_id: str,
        response_schema: dict[str, Any],
        max_tokens: int,
        context: dict[str, Any],
    ) -> tuple[Any, list[dict[str, Any]]]:
        slot_id = context["slot_id"]
        packet = safe_slot_packet(self.scenario, slot_id)
        if role.startswith("plain_summary_") and role != "plain_summary_coordinator":
            parsed: Any = {"briefing": json.dumps(role_packet(packet, context["role"]), ensure_ascii=False)}
        elif role == "evidence_shared_incident_reader":
            parsed = {
                "observation_rows": [
                    {"observation_id": row["observation_id"], "relevance": "Retain current signal."}
                    for row in packet["visible_observations"]
                ]
            }
        elif role == "evidence_shared_resource_reader":
            parsed = {
                "resource_ids": [row["resource_id"] for row in packet["eligible_resources"]],
                "target_ids": [row["target_id"] for row in packet["eligible_targets"]],
                "rule_notes": [json.dumps(packet["action_contract"], sort_keys=True)],
            }
        elif role == "evidence_shared_uncertainty_reader":
            parsed = {
                "observation_ids": [row["observation_id"] for row in packet["visible_observations"]],
                "unknown_ids": [row["unknown_id"] for row in packet["required_unknowns"]],
                "assumption_notes": list(packet["assumptions"]),
            }
        else:
            parsed = valid_decision(self.scenario, slot_id)
            if role == "evidence_table_coordinator" and self.fault_initial_evidence:
                parsed["acknowledged_unknown_ids"] = parsed["acknowledged_unknown_ids"][1:]
        raw = json.dumps(parsed, ensure_ascii=False)
        record = {
            "request_id": request_id,
            "request_body_sha256": "b" * 64,
            "request_body": {"messages": messages},
            "role": role,
            "context": context,
            "raw_response": raw,
            "parsed_response": parsed,
            "valid_json": True,
            "usage": {"completion_tokens": 10},
            "latency_seconds": 0.01,
        }
        return parsed, [record]


class RunnerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.scenario = load_scenario()

    def test_identity_matches_independent_node_verifier(self) -> None:
        self.assertEqual(
            _identity(self.scenario),
            {
                "scenario_basis_sha256": "44b50be04f1d742a6f85b68a4a7b64cbb1d411b9b4ef6be8559d6d2bacddf750",
                "observation_set_sha256": "651670d9c7d6592b1911d598e44b8eb1636cfa7988cf39efdc15f6af30ac63c6",
                "resources_sha256": "02046459c4928c629c2a2ceeb0cc2efd424873b30dfdedf00d00e097ca641784",
                "decision_slots_sha256": "46494bd0ea882b082869baf7086fb1d3b0d8ab714d16fc900cf7445b7916060e",
            },
        )

    def test_every_agent_packet_is_redacted(self) -> None:
        hidden = ("historical_choice", "observed_mobilized_at", "availability_note")
        by = indexes(self.scenario)
        for slot_id, slot in by["slots"].items():
            packet = safe_slot_packet(self.scenario, slot_id)
            serialized = json.dumps(packet, ensure_ascii=False)
            for field in hidden:
                self.assertNotIn(field, serialized)
            for observation_id in slot["forbidden_hindsight_observation_ids"]:
                self.assertNotIn(observation_id, serialized)
                self.assertNotIn(by["observations"][observation_id]["plain_text"], serialized)

    def test_compiler_preserves_ids_and_marks_omissions(self) -> None:
        slot_id = "slot-02-missing-telemetry-triage"
        packet = safe_slot_packet(self.scenario, slot_id)
        readers = {
            "incident_reader": {"observation_rows": []},
            "resource_reader": {"resource_ids": [], "target_ids": [], "rule_notes": []},
            "uncertainty_reader": {"observation_ids": [], "unknown_ids": [], "assumption_notes": []},
        }
        table = compile_evidence_table(self.scenario, packet, readers)
        self.assertEqual(set(table["omitted_observation_ids"]), set(indexes(self.scenario)["slots"][slot_id]["visible_observation_ids"]))
        self.assertEqual(set(table["omitted_unknown_ids"]), set(indexes(self.scenario)["slots"][slot_id]["required_unknown_ids"]))

    def test_scoring_detects_unknown_constraint_and_hindsight_failures(self) -> None:
        slot_id = "slot-09-push-water-planning"
        decision = valid_decision(self.scenario, slot_id)
        self.assertTrue(score_decision(self.scenario, slot_id, decision)["fully_valid"])
        broken = deepcopy(decision)
        broken["acknowledged_unknown_ids"] = []
        broken["assignments"][0]["quantity"] = 23
        raw = json.dumps(broken) + " later 108100 households"
        score = score_decision(self.scenario, slot_id, broken, raw_response=raw)
        codes = {row["code"] for row in score["violations"]}
        self.assertIn("MISSING_REQUIRED_UNKNOWN", codes)
        self.assertIn("CONSTRAINT_QUANTITY", codes)
        self.assertIn("CONSTRAINT_RESOURCE_CAPACITY", codes)
        self.assertIn("HINDSIGHT_FINGERPRINT", codes)

    def test_nonpositive_quantity_feedback_names_the_actual_violation(self) -> None:
        slot_id = "slot-09-push-water-planning"
        decision = valid_decision(self.scenario, slot_id)
        decision["assignments"][0]["quantity"] = 0
        score = score_decision(self.scenario, slot_id, decision)
        self.assertFalse(score["constraint_pass"])
        self.assertEqual(
            score["violations"],
            [
                {
                    "code": "CONSTRAINT_QUANTITY",
                    "detail": (
                        "assignment 0 (jwwa-additional-water-truck-pool -> kumamoto-city) "
                        "quantity 0 must be at least 1"
                    ),
                }
            ],
        )

    def test_manifest_records_numeric_top_p_and_six_orders(self) -> None:
        orders = {tuple(row["logical_arm_order"]) for row in configs()}
        self.assertEqual(len(orders), 6)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "freeze.json"
            manifest = create(path)
            self.assertEqual(manifest["model"]["top_p"], TOP_P)
            self.assertIsInstance(manifest["model"]["top_p"], float)
            self.assertEqual(manifest["independent_countersign"]["protocol_board_message"], 729)
            self.assertEqual(manifest["independent_countersign"]["amendment_board_message"], 766)
            self.assertTrue(validate(path)["passes"])

    def test_shared_initial_answer_and_feedback_isolation(self) -> None:
        config = configs()[0]
        backend = FakeBackend(self.scenario, fault_initial_evidence=True)
        manifest = {
            "matched_input_identity": _identity(self.scenario),
            "scenario_sha256": "s" * 64,
            "protocol_sha256": "p" * 64,
            "runner_sha256": "r" * 64,
            "prompt_template_sha256": "t" * 64,
            "model": {"revision": "fake-revision"},
            "freeze_manifest_hash": "f" * 64,
        }
        result, calls = asyncio.run(
            run_config(config, backend=backend, scenario=self.scenario, manifest=manifest)
        )
        self.assertEqual(set(result["arms"]), set(ARM_IDS))
        self.assertEqual(result["unique_request_count"], 9)
        self.assertEqual(len(calls), 9)
        self.assertFalse(result["arms"]["evidence_table"]["score"]["fully_valid"])
        self.assertTrue(result["arms"]["evidence_feedback"]["score"]["fully_valid"])
        self.assertTrue(result["arms"]["evidence_feedback"]["repaired"])
        self.assertEqual(
            result["arms"]["evidence_feedback"]["initial_decision"],
            result["arms"]["evidence_table"]["decision"],
        )
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            _write_result(output, result, calls, manifest)
            valid, reason = validate_result_dir(output / config["config_id"], manifest)
            self.assertTrue(valid, reason)

    def test_transport_retry_keeps_the_exact_request_body(self) -> None:
        async def exercise() -> tuple[Any, list[dict[str, Any]]]:
            backend = Backend(
                "http://test/v1",
                "Qwen/Qwen3-32B-AWQ",
                "fake-revision",
                temperature=0.2,
            )
            await backend._client.aclose()
            attempts = 0

            async def handler(request: httpx.Request) -> httpx.Response:
                nonlocal attempts
                attempts += 1
                if attempts == 1:
                    raise httpx.ConnectError("temporary transport loss", request=request)
                return httpx.Response(
                    200,
                    request=request,
                    json={
                        "choices": [{"message": {"content": '{"briefing":"ready"}'}}],
                        "usage": {"completion_tokens": 2},
                    },
                )

            backend._client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
            try:
                return await backend.chat(
                    role="test_reader",
                    messages=[{"role": "user", "content": "test"}],
                    request_seed=7,
                    request_id="same-request",
                    response_schema=PLAIN_READER_SCHEMA,
                    max_tokens=20,
                    context={"arm": "test", "slot_id": "test"},
                )
            finally:
                await backend.close()

        parsed, records = asyncio.run(exercise())
        self.assertEqual(parsed, {"briefing": "ready"})
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["request_body_sha256"], records[1]["request_body_sha256"])
        self.assertEqual(records[0]["request_body"], records[1]["request_body"])


if __name__ == "__main__":
    unittest.main()
