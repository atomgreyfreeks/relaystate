from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from .util import load_json


ROLE_IDS = ("incident_reader", "resource_reader", "uncertainty_reader")
ARM_IDS = ("plain_summary", "evidence_table", "evidence_feedback")


def repository_root() -> Path:
    return Path(__file__).resolve().parents[4]


def experiment_root() -> Path:
    return Path(__file__).resolve().parents[2]


def scenario_path() -> Path:
    return repository_root() / "product/disaster-replay/scenarios/kumamoto-2026-real-response/scenario.json"


def load_scenario() -> dict[str, Any]:
    return load_json(scenario_path())


def indexes(scenario: dict[str, Any]) -> dict[str, dict[str, dict[str, Any]]]:
    specs = {
        "sources": (scenario["sources"], "source_id"),
        "observations": (scenario["observations"], "observation_id"),
        "unknowns": (scenario["unknowns"], "unknown_id"),
        "targets": (scenario["targets"], "target_id"),
        "resources": (scenario["resources"], "resource_id"),
        "slots": (scenario["decision_slots"], "decision_slot_id"),
    }
    output: dict[str, dict[str, dict[str, Any]]] = {}
    for name, (rows, key) in specs.items():
        output[name] = {row[key]: row for row in rows}
        if len(output[name]) != len(rows):
            raise ValueError(f"duplicate {name} ID")
    return output


def safe_slot_packet(scenario: dict[str, Any], slot_id: str) -> dict[str, Any]:
    by = indexes(scenario)
    slot = by["slots"][slot_id]
    cutoff = datetime.fromisoformat(slot["cutoff_at"])
    observations = []
    for observation_id in slot["visible_observation_ids"]:
        observation = by["observations"][observation_id]
        if datetime.fromisoformat(observation["available_at"]) > cutoff:
            raise ValueError(f"{slot_id} exposes {observation_id} after cutoff")
        if observation["classification"] == "LATER_OUTCOME":
            raise ValueError(f"{slot_id} exposes later outcome {observation_id}")
        observations.append(dict(observation))
    forbidden = set(slot["forbidden_hindsight_observation_ids"])
    if forbidden.intersection(slot["visible_observation_ids"]):
        raise ValueError(f"{slot_id} exposes a forbidden observation")
    resources = [
        {
            key: resource[key]
            for key in ("resource_id", "label", "kind", "classification", "capacity")
        }
        for resource_id in slot["eligible_resource_ids"]
        for resource in [by["resources"][resource_id]]
    ]
    targets = [dict(by["targets"][target_id]) for target_id in slot["eligible_target_ids"]]
    unknowns = [dict(by["unknowns"][unknown_id]) for unknown_id in slot["required_unknown_ids"]]
    return {
        "scenario_id": scenario["scenario_id"],
        "incident": dict(scenario["incident"]),
        "decision_slot_id": slot_id,
        "decision_kind": slot["decision_kind"],
        "cutoff_at": slot["cutoff_at"],
        "task": slot["task"],
        "action_contract": dict(slot["action_contract"]),
        "visible_observations": observations,
        "eligible_resources": resources,
        "eligible_targets": targets,
        "required_unknowns": unknowns,
        "assumptions": list(slot["assumptions"]),
    }


def role_packet(packet: dict[str, Any], role: str) -> dict[str, Any]:
    common = {
        "scenario_id": packet["scenario_id"],
        "decision_slot_id": packet["decision_slot_id"],
        "cutoff_at": packet["cutoff_at"],
        "task": packet["task"],
    }
    if role == "incident_reader":
        return {**common, "incident": packet["incident"], "visible_observations": packet["visible_observations"]}
    if role == "resource_reader":
        return {
            **common,
            "eligible_resources": packet["eligible_resources"],
            "eligible_targets": packet["eligible_targets"],
            "action_contract": packet["action_contract"],
        }
    if role == "uncertainty_reader":
        return {
            **common,
            "visible_observations": packet["visible_observations"],
            "required_unknowns": packet["required_unknowns"],
            "assumptions": packet["assumptions"],
        }
    raise ValueError(f"unknown role {role}")


def forbidden_fingerprints(scenario: dict[str, Any], slot_id: str) -> list[str]:
    by = indexes(scenario)
    slot = by["slots"][slot_id]
    values: list[str] = []
    for observation_id in slot["forbidden_hindsight_observation_ids"]:
        observation = by["observations"][observation_id]
        values.append(observation_id.lower())
        value = observation.get("value")
        if isinstance(value, (str, int, float)) and str(value).strip():
            values.append(str(value).lower())
    return sorted(set(values))
