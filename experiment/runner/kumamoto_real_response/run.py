from __future__ import annotations

import asyncio
import math
import random
import statistics
import time
import traceback
from pathlib import Path
from typing import Any

from .backend import (
    DECISION_SCHEMA,
    EVIDENCE_READER_SCHEMAS,
    PLAIN_READER_SCHEMA,
    Backend,
    coordinator_prompt,
    feedback_prompt,
    reader_prompt,
)
from .graph import compile_evidence_table, historical_overlap
from .scenario import ROLE_IDS, forbidden_fingerprints, indexes, load_scenario, role_packet, safe_slot_packet
from .scoring import feedback_messages, score_decision
from .util import atomic_json, atomic_jsonl, hash_obj, load_json, sha256_file


def _request_seed(seed: int, role: str) -> int:
    return seed + {"incident_reader": 11, "resource_reader": 22, "uncertainty_reader": 33, "coordinator": 44, "feedback": 55}[role]


async def _readers(
    backend: Backend,
    packet: dict[str, Any],
    *,
    seed: int,
    evidence: bool,
    config_id: str,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    async def one(role: str) -> tuple[str, Any, list[dict[str, Any]]]:
        arm = "evidence_shared" if evidence else "plain_summary"
        parsed, records = await backend.chat(
            role=f"{arm}_{role}",
            messages=reader_prompt(role, role_packet(packet, role), evidence=evidence),
            request_seed=_request_seed(seed, role),
            request_id=f"krr:{config_id}:{arm}:{role}",
            response_schema=EVIDENCE_READER_SCHEMAS[role] if evidence else PLAIN_READER_SCHEMA,
            max_tokens=1000 if evidence else 800,
            context={"config_id": config_id, "slot_id": packet["decision_slot_id"], "arm": arm, "role": role},
        )
        return role, parsed, records

    results = await asyncio.gather(*(one(role) for role in ROLE_IDS))
    outputs = {role: parsed for role, parsed, _ in results}
    records = [record for _, _, role_records in results for record in role_records]
    return outputs, records


async def _plain_pass(
    backend: Backend,
    packet: dict[str, Any],
    scenario: dict[str, Any],
    *,
    seed: int,
    config_id: str,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    readers, records = await _readers(backend, packet, seed=seed, evidence=False, config_id=config_id)
    handoff = {
        role: (value.get("briefing", "") if isinstance(value, dict) else "[reader response unavailable]")
        for role, value in readers.items()
    }
    messages = coordinator_prompt(packet, handoff, evidence=False)
    decision, coordinator_records = await backend.chat(
        role="plain_summary_coordinator",
        messages=messages,
        request_seed=_request_seed(seed, "coordinator"),
        request_id=f"krr:{config_id}:plain_summary:coordinator",
        response_schema=DECISION_SCHEMA,
        max_tokens=1200,
        context={"config_id": config_id, "slot_id": packet["decision_slot_id"], "arm": "plain_summary", "role": "coordinator"},
    )
    records.extend(coordinator_records)
    raw = coordinator_records[-1]["raw_response"]
    score = score_decision(scenario, packet["decision_slot_id"], decision, raw_response=raw)
    return {
        "arm": "plain_summary",
        "reader_outputs": readers,
        "specialist_handoff": handoff,
        "decision": decision,
        "score": score,
        "historical_overlap": historical_overlap(scenario, packet["decision_slot_id"], decision),
        "logical_model_calls": 4,
    }, records


async def _evidence_pass(
    backend: Backend,
    packet: dict[str, Any],
    scenario: dict[str, Any],
    *,
    seed: int,
    config_id: str,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
    readers, records = await _readers(backend, packet, seed=seed, evidence=True, config_id=config_id)
    table = compile_evidence_table(scenario, packet, readers)
    messages = coordinator_prompt(packet, table, evidence=True)
    decision, coordinator_records = await backend.chat(
        role="evidence_table_coordinator",
        messages=messages,
        request_seed=_request_seed(seed, "coordinator"),
        request_id=f"krr:{config_id}:evidence_table:coordinator",
        response_schema=DECISION_SCHEMA,
        max_tokens=1200,
        context={"config_id": config_id, "slot_id": packet["decision_slot_id"], "arm": "evidence_table", "role": "coordinator"},
    )
    records.extend(coordinator_records)
    raw = coordinator_records[-1]["raw_response"]
    initial_score = score_decision(scenario, packet["decision_slot_id"], decision, raw_response=raw)
    evidence = {
        "arm": "evidence_table",
        "reader_outputs": readers,
        "compiled_evidence_table": table,
        "decision": decision,
        "score": initial_score,
        "historical_overlap": historical_overlap(scenario, packet["decision_slot_id"], decision),
        "logical_model_calls": 4,
    }

    feedback_called = not initial_score["fully_valid"]
    final_decision = decision
    final_raw = raw
    if feedback_called:
        revision, revision_records = await backend.chat(
            role="evidence_feedback_revision",
            messages=feedback_prompt(messages, raw, feedback_messages(initial_score)),
            request_seed=_request_seed(seed, "feedback"),
            request_id=f"krr:{config_id}:evidence_feedback:revision",
            response_schema=DECISION_SCHEMA,
            max_tokens=1200,
            context={"config_id": config_id, "slot_id": packet["decision_slot_id"], "arm": "evidence_feedback", "role": "revision"},
        )
        records.extend(revision_records)
        final_decision = revision
        final_raw = revision_records[-1]["raw_response"]
    final_score = score_decision(scenario, packet["decision_slot_id"], final_decision, raw_response=final_raw)
    feedback = {
        "arm": "evidence_feedback",
        "parent_arm": "evidence_table",
        "initial_decision": decision,
        "initial_score": initial_score,
        "feedback_called": feedback_called,
        "feedback_messages": feedback_messages(initial_score) if feedback_called else [],
        "decision": final_decision,
        "score": final_score,
        "repaired": feedback_called and not initial_score["fully_valid"] and final_score["fully_valid"],
        "introduced_error": initial_score["fully_valid"] and not final_score["fully_valid"],
        "historical_overlap": historical_overlap(scenario, packet["decision_slot_id"], final_decision),
        "logical_model_calls": 5 if feedback_called else 4,
    }
    return evidence, feedback, records


def _response_tokens(records: list[dict[str, Any]], arms: set[str]) -> int:
    return sum(
        int(record.get("usage", {}).get("completion_tokens", 0) or 0)
        for record in records
        if record.get("context", {}).get("arm") in arms and record.get("valid_json")
    )


async def run_config(
    config: dict[str, Any],
    *,
    backend: Backend,
    scenario: dict[str, Any],
    manifest: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    packet = safe_slot_packet(scenario, config["slot_id"])
    all_records: list[dict[str, Any]] = []
    outputs: dict[str, dict[str, Any]] = {}
    started = time.perf_counter()
    for physical_pass in config["physical_pass_order"]:
        if physical_pass == "plain":
            outputs["plain_summary"], records = await _plain_pass(
                backend, packet, scenario, seed=config["seed"], config_id=config["config_id"]
            )
            all_records.extend(records)
        else:
            evidence, feedback, records = await _evidence_pass(
                backend, packet, scenario, seed=config["seed"], config_id=config["config_id"]
            )
            outputs["evidence_table"] = evidence
            outputs["evidence_feedback"] = feedback
            all_records.extend(records)
    ordered_outputs = {arm: outputs[arm] for arm in config["logical_arm_order"]}
    identity = {
        **manifest["matched_input_identity"],
        "scenario_sha256": manifest["scenario_sha256"],
        "protocol_sha256": manifest["protocol_sha256"],
        "runner_sha256": manifest["runner_sha256"],
        "prompt_template_sha256": manifest["prompt_template_sha256"],
        "model_revision": manifest["model"]["revision"],
    }
    result = {
        "schema_version": 1,
        "config": config,
        "manifest_hash": manifest["freeze_manifest_hash"],
        "identity": identity,
        "endpoint": backend.base_url,
        "arms": ordered_outputs,
        "physical_attempt_count": len(all_records),
        "unique_request_count": len({record["request_id"] for record in all_records}),
        "evidence_initial_output_tokens": _response_tokens(all_records, {"evidence_shared", "evidence_table"}),
        "feedback_total_output_tokens": _response_tokens(all_records, {"evidence_shared", "evidence_table", "evidence_feedback"}),
        "elapsed_seconds": round(time.perf_counter() - started, 6),
    }
    return result, all_records


def validate_result_dir(path: Path, manifest: dict[str, Any]) -> tuple[bool, str]:
    try:
        result_path = path / "result.json"
        calls_path = path / "calls.jsonl"
        certificate_path = path / "certificate.json"
        if not all(candidate.is_file() for candidate in (result_path, calls_path, certificate_path)):
            return False, "missing artifact"
        result = load_json(result_path)
        certificate = load_json(certificate_path)
        stored = certificate.pop("certificate_hash", None)
        if stored != hash_obj(certificate):
            return False, "certificate hash mismatch"
        if certificate["manifest_hash"] != manifest["freeze_manifest_hash"]:
            return False, "manifest mismatch"
        if certificate["result_sha256"] != sha256_file(result_path) or certificate["calls_sha256"] != sha256_file(calls_path):
            return False, "artifact hash mismatch"
        if result["identity"] != {
            **manifest["matched_input_identity"],
            "scenario_sha256": manifest["scenario_sha256"],
            "protocol_sha256": manifest["protocol_sha256"],
            "runner_sha256": manifest["runner_sha256"],
            "prompt_template_sha256": manifest["prompt_template_sha256"],
            "model_revision": manifest["model"]["revision"],
        }:
            return False, "identity mismatch"
        if set(result["arms"]) != {"plain_summary", "evidence_table", "evidence_feedback"}:
            return False, "arm mismatch"
        calls = [load for line in calls_path.read_text(encoding="utf-8").splitlines() if line for load in [__import__("json").loads(line)]]
        if len(calls) != result["physical_attempt_count"]:
            return False, "call count mismatch"
        request_hashes: dict[str, str] = {}
        for call in calls:
            request_id = call["request_id"]
            body_hash = call["request_body_sha256"]
            if request_id in request_hashes and request_hashes[request_id] != body_hash:
                return False, "transport retry changed request body"
            request_hashes[request_id] = body_hash
        if len(request_hashes) not in {8, 9}:
            return False, "logical request count is not 8 or 9"
        scenario = load_scenario()
        slot = indexes(scenario)["slots"][result["config"]["slot_id"]]
        forbidden = [indexes(scenario)["observations"][item] for item in slot["forbidden_hindsight_observation_ids"]]
        for call in calls:
            if call["context"]["arm"] == "evidence_feedback":
                continue
            prompt = str(call["request_body"].get("messages", []))
            if any(token in prompt for token in ("historical_choice", "observed_mobilized_at", "availability_note")):
                return False, "hidden scenario field leaked into prompt"
            if any(row["observation_id"] in prompt or row["plain_text"] in prompt for row in forbidden):
                return False, "forbidden observation leaked into prompt"
        return True, "ok"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


def _write_result(output: Path, result: dict[str, Any], calls: list[dict[str, Any]], manifest: dict[str, Any]) -> None:
    target = output / result["config"]["config_id"]
    target.mkdir(parents=True, exist_ok=True)
    atomic_json(target / "result.json", result)
    atomic_jsonl(target / "calls.jsonl", calls)
    certificate = {
        "schema_version": 1,
        "config_id": result["config"]["config_id"],
        "manifest_hash": manifest["freeze_manifest_hash"],
        "result_sha256": sha256_file(target / "result.json"),
        "calls_sha256": sha256_file(target / "calls.jsonl"),
    }
    certificate["certificate_hash"] = hash_obj(certificate)
    atomic_json(target / "certificate.json", certificate)


async def run_shard(
    *,
    manifest: dict[str, Any],
    output: Path,
    base_url: str,
    phase: str,
    shard_index: int,
    shard_count: int,
    config_concurrency: int,
    call_concurrency: int,
) -> dict[str, Any]:
    rows = manifest["smoke_configs" if phase == "smoke" else "production_configs"]
    assigned = [row for row in rows if row["pair_index"] % shard_count == shard_index]
    backend = Backend(
        base_url,
        manifest["model"]["id"],
        manifest["model"]["revision"],
        temperature=manifest["model"]["temperature"],
        top_p=manifest["model"]["top_p"],
        max_concurrency=call_concurrency,
    )
    health = await backend.health()
    if health["effective_top_p"] != manifest["model"]["top_p"]:
        raise RuntimeError("endpoint request top-p differs from frozen top-p")
    scenario = load_scenario()
    semaphore = asyncio.Semaphore(config_concurrency)
    counters = {"assigned": len(assigned), "completed": 0, "skipped": 0, "failed": 0}
    failures: list[dict[str, str]] = []
    started = time.perf_counter()

    async def one(config: dict[str, Any]) -> None:
        target = output / config["config_id"]
        valid, _ = validate_result_dir(target, manifest)
        if valid:
            counters["skipped"] += 1
            return
        async with semaphore:
            try:
                result, calls = await run_config(config, backend=backend, scenario=scenario, manifest=manifest)
                _write_result(output, result, calls, manifest)
                valid, reason = validate_result_dir(target, manifest)
                if not valid:
                    raise ValueError(reason)
                counters["completed"] += 1
                print(f"completed {config['config_id']}", flush=True)
            except Exception as exc:
                counters["failed"] += 1
                failures.append({"config_id": config["config_id"], "error": f"{type(exc).__name__}: {exc}"})
                atomic_json(
                    output / "failures" / f"{config['config_id']}.json",
                    {"config": config, "error": f"{type(exc).__name__}: {exc}", "traceback": traceback.format_exc()},
                )
                print(f"FAILED {config['config_id']}: {type(exc).__name__}: {exc}", flush=True)

    try:
        await asyncio.gather(*(one(config) for config in assigned))
    finally:
        await backend.close()
    summary = {
        "schema_version": 1,
        "phase": phase,
        "manifest_hash": manifest["freeze_manifest_hash"],
        "shard_index": shard_index,
        "shard_count": shard_count,
        "endpoint_health": health,
        **counters,
        "failures": failures,
        "elapsed_seconds": round(time.perf_counter() - started, 6),
    }
    atomic_json(output / f"shard-{shard_index}-summary.json", summary)
    if failures:
        raise RuntimeError(f"{len(failures)} configurations failed")
    return summary


def _bootstrap_ci(values: list[float], *, seed: int, repetitions: int) -> list[float]:
    rng = random.Random(seed)
    means = []
    for _ in range(repetitions):
        sample = [values[rng.randrange(len(values))] for _ in values]
        means.append(statistics.fmean(sample))
    means.sort()
    return [means[int(0.025 * repetitions)], means[min(repetitions - 1, int(0.975 * repetitions))]]


def analyze(output: Path, manifest: dict[str, Any], *, phase: str) -> dict[str, Any]:
    expected = manifest["smoke_configs" if phase == "smoke" else "production_configs"]
    results: list[dict[str, Any]] = []
    invalid_artifacts = []
    for config in expected:
        target = output / config["config_id"]
        valid, reason = validate_result_dir(target, manifest)
        if not valid:
            invalid_artifacts.append({"config_id": config["config_id"], "reason": reason})
        else:
            results.append(load_json(target / "result.json"))
    arms: dict[str, dict[str, Any]] = {}
    for arm in ("plain_summary", "evidence_table", "evidence_feedback"):
        scores = [row["arms"][arm]["score"] for row in results]
        arms[arm] = {
            "decisions": len(scores),
            "gradable": sum(score["gradable"] for score in scores),
            "fully_valid": sum(score["fully_valid"] for score in scores),
            "fully_valid_rate": statistics.fmean(score["fully_valid"] for score in scores) if scores else math.nan,
            "communication_failures": sum(score["communication_failure"] for score in scores),
            "communication_failure_rate": statistics.fmean(score["communication_failure"] for score in scores) if scores else math.nan,
            "constraint_pass_rate": statistics.fmean(score["constraint_pass"] for score in scores) if scores else math.nan,
            "hindsight_violations": sum(score["hindsight_violation_count"] for score in scores),
            "mean_required_unknown_coverage": statistics.fmean(score["required_unknown_coverage"] for score in scores) if scores else math.nan,
        }
    paired = [
        int(row["arms"]["evidence_table"]["score"]["fully_valid"])
        - int(row["arms"]["plain_summary"]["score"]["fully_valid"])
        for row in results
    ]
    threshold = manifest["thresholds"]
    plain = arms["plain_summary"]
    evidence = arms["evidence_table"]
    feedback = arms["evidence_feedback"]
    validity_gain = evidence["fully_valid_rate"] - plain["fully_valid_rate"] if results else math.nan
    ci = _bootstrap_ci(paired, seed=260728, repetitions=threshold["bootstrap_repetitions"]) if paired else [math.nan, math.nan]
    invalid_initial = [row for row in results if not row["arms"]["evidence_table"]["score"]["fully_valid"]]
    repairs = sum(row["arms"]["evidence_feedback"]["repaired"] for row in invalid_initial)
    evidence_tokens = [row["evidence_initial_output_tokens"] for row in results]
    feedback_tokens = [row["feedback_total_output_tokens"] for row in results]
    token_ratio = (
        statistics.median(feedback_tokens) / statistics.median(evidence_tokens)
        if evidence_tokens and statistics.median(evidence_tokens) > 0 else math.nan
    )
    complete = len(results) == len(expected) and not invalid_artifacts
    evidence_rules = {
        "complete_and_gradable": complete and sum(item["gradable"] for item in arms.values()) == len(expected) * 3,
        "validity_gain": validity_gain >= threshold["evidence_validity_gain_percentage_points"] / 100 if results else False,
        "bootstrap_excludes_zero": ci[0] > 0,
        "communication_factor": (
            plain["communication_failures"] >= threshold["minimum_control_communication_failures"]
            and evidence["communication_failures"] <= plain["communication_failures"] * threshold["communication_failure_factor_at_most"]
        ),
        "constraint_noninferiority": (
            evidence["constraint_pass_rate"] >= plain["constraint_pass_rate"]
            - threshold["constraint_pass_drop_percentage_points_at_most"] / 100
        ) if results else False,
    }
    feedback_rules = {
        "nondecreasing_validity": feedback["fully_valid_rate"] >= evidence["fully_valid_rate"] if results else False,
        "repair_rate": (
            len(invalid_initial) >= threshold["minimum_invalid_evidence_answers"]
            and repairs / len(invalid_initial) >= threshold["feedback_repair_fraction_at_least"]
        ) if invalid_initial else False,
        "introduced_errors": sum(row["arms"]["evidence_feedback"]["introduced_error"] for row in results) == threshold["feedback_introduced_errors"],
        "one_call_ceiling": all(row["arms"]["evidence_feedback"]["logical_model_calls"] <= 5 for row in results),
        "output_token_ratio": token_ratio <= threshold["feedback_output_token_ratio_at_most"] if not math.isnan(token_ratio) else False,
    }
    analysis = {
        "schema_version": 1,
        "phase": phase,
        "manifest_hash": manifest["freeze_manifest_hash"],
        "expected_configs": len(expected),
        "valid_configs": len(results),
        "invalid_artifacts": invalid_artifacts,
        "arms": arms,
        "evidence_table_comparison": {
            "verdict": (
                "UNDERPOWERED"
                if plain["communication_failures"]
                < threshold["minimum_control_communication_failures"]
                else "PASS" if all(evidence_rules.values()) else "FAIL"
            ),
            "validity_gain": validity_gain,
            "paired_bootstrap_95_ci": ci,
            "rules": evidence_rules,
            "claim_passes": all(evidence_rules.values()),
        },
        "feedback_comparison": {
            "verdict": (
                "UNDERPOWERED"
                if len(invalid_initial) < threshold["minimum_invalid_evidence_answers"]
                else "PASS" if all(feedback_rules.values()) else "FAIL"
            ),
            "invalid_initial_answers": len(invalid_initial),
            "repairs": repairs,
            "repair_rate": repairs / len(invalid_initial) if invalid_initial else None,
            "median_output_token_ratio": token_ratio,
            "rules": feedback_rules,
            "claim_passes": all(feedback_rules.values()),
        },
        "historical_overlap_disclosure": "Descriptive only; excluded from every pass rule.",
    }
    atomic_json(output / f"{phase}-analysis.json", analysis)
    return analysis
