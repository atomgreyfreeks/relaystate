from __future__ import annotations

import itertools
from pathlib import Path
from typing import Any

from . import VERSION
from .backend import TOP_P
from .scenario import ARM_IDS, experiment_root, indexes, load_scenario, repository_root, scenario_path
from .util import atomic_json, hash_obj, hash_tree, load_json, sha256_file


MODEL = {"id": "Qwen/Qwen3-32B-AWQ", "revision": "0499c3ac83fdef8810b907a23894ba91e95eddd8"}
PRODUCTION_SEEDS = tuple(range(51101, 51109))
SMOKE_SEED = 51000
TEMPERATURE = 0.2
COUNTERSIGN = {
    "author": "codex",
    "reviewer": "claude",
    "protocol_board_message": 729,
    "amendment_board_message": 766,
    "audit_correction_board_message": 767,
    "scope": "original protocol plus Amendment 1's narrow quantity-feedback diagnostic repair",
}


def _identity(scenario: dict[str, Any]) -> dict[str, str]:
    excluded = {"observations", "resources", "decision_slots"}
    basis = {key: value for key, value in scenario.items() if key not in excluded}
    return {
        "scenario_basis_sha256": hash_obj(basis),
        "observation_set_sha256": hash_obj(sorted(scenario["observations"], key=lambda row: row["observation_id"])),
        "resources_sha256": hash_obj(sorted(scenario["resources"], key=lambda row: row["resource_id"])),
        "decision_slots_sha256": hash_obj(sorted(scenario["decision_slots"], key=lambda row: row["decision_slot_id"])),
    }


def runner_sha256() -> str:
    root = experiment_root()
    return hash_tree((root / "runner").rglob("*.py"), relative_to=root)


def configs() -> list[dict[str, Any]]:
    scenario = load_scenario()
    slots = sorted(indexes(scenario)["slots"].values(), key=lambda row: row["reconstruction_slot_number"])
    permutations = list(itertools.permutations(ARM_IDS))
    rows: list[dict[str, Any]] = []
    for seed_index, seed in enumerate(PRODUCTION_SEEDS):
        for slot_index, slot in enumerate(slots):
            pair_index = seed_index * len(slots) + slot_index
            rows.append(
                {
                    "config_id": f"seed-{seed}-{slot['decision_slot_id']}",
                    "pair_index": pair_index,
                    "seed": seed,
                    "slot_id": slot["decision_slot_id"],
                    "slot_number": slot["reconstruction_slot_number"],
                    "physical_pass_order": ["plain", "evidence"] if pair_index % 2 == 0 else ["evidence", "plain"],
                    "logical_arm_order": list(permutations[pair_index % len(permutations)]),
                }
            )
    return rows


def smoke_configs() -> list[dict[str, Any]]:
    rows = [dict(row) for row in configs()[:5]]
    for pair_index, row in enumerate(rows):
        row["seed"] = SMOKE_SEED
        row["pair_index"] = pair_index
        row["config_id"] = f"smoke-{SMOKE_SEED}-{row['slot_id']}"
        row["physical_pass_order"] = ["plain", "evidence"] if pair_index % 2 == 0 else ["evidence", "plain"]
    return rows


def create(path: Path) -> dict[str, Any]:
    scenario = load_scenario()
    root = experiment_root()
    manifest = {
        "schema_version": 1,
        "protocol_version": VERSION,
        "status": "AMENDED_AFTER_SMOKE_BEFORE_PRODUCTION",
        "independent_countersign": COUNTERSIGN,
        "model": {**MODEL, "temperature": TEMPERATURE, "top_p": TOP_P},
        "scenario_path": scenario_path().relative_to(repository_root()).as_posix(),
        "scenario_sha256": sha256_file(scenario_path()),
        "matched_input_identity": _identity(scenario),
        "protocol_sha256": sha256_file(root / "PREREG.md"),
        "runner_sha256": runner_sha256(),
        "prompt_template_sha256": sha256_file(root / "runner/kumamoto_real_response/backend.py"),
        "production_seeds": list(PRODUCTION_SEEDS),
        "smoke_seed": SMOKE_SEED,
        "arms": list(ARM_IDS),
        "slot_numbers": [1, 2, 4, 6, 9],
        "production_configs": configs(),
        "smoke_configs": smoke_configs(),
        "thresholds": {
            "evidence_validity_gain_percentage_points": 15,
            "bootstrap_repetitions": 10000,
            "communication_failure_factor_at_most": 0.5,
            "minimum_control_communication_failures": 4,
            "constraint_pass_drop_percentage_points_at_most": 5,
            "feedback_repair_fraction_at_least": 0.5,
            "minimum_invalid_evidence_answers": 4,
            "feedback_introduced_errors": 0,
            "feedback_output_token_ratio_at_most": 1.5,
        },
    }
    manifest["freeze_manifest_hash"] = hash_obj(manifest)
    atomic_json(path, manifest)
    return manifest


def validate(path: Path) -> dict[str, Any]:
    manifest = load_json(path)
    bare = {key: value for key, value in manifest.items() if key != "freeze_manifest_hash"}
    scenario = load_scenario()
    checks = {
        "manifest_hash": manifest.get("freeze_manifest_hash") == hash_obj(bare),
        "protocol_version": manifest.get("protocol_version") == VERSION,
        "status": manifest.get("status") == "AMENDED_AFTER_SMOKE_BEFORE_PRODUCTION",
        "independent_countersign": manifest.get("independent_countersign") == COUNTERSIGN,
        "model": manifest.get("model") == {**MODEL, "temperature": TEMPERATURE, "top_p": TOP_P},
        "scenario_hash": manifest.get("scenario_sha256") == sha256_file(scenario_path()),
        "matched_identity": manifest.get("matched_input_identity") == _identity(scenario),
        "protocol_hash": manifest.get("protocol_sha256") == sha256_file(experiment_root() / "PREREG.md"),
        "runner_hash": manifest.get("runner_sha256") == runner_sha256(),
        "prompt_hash": manifest.get("prompt_template_sha256") == sha256_file(experiment_root() / "runner/kumamoto_real_response/backend.py"),
        "configs": manifest.get("production_configs") == configs() and manifest.get("smoke_configs") == smoke_configs(),
    }
    if not all(checks.values()):
        raise ValueError(f"freeze validation failed: {checks}")
    return {"passes": True, "checks": checks, "manifest": manifest}
