from __future__ import annotations

from typing import Any

from .scenario import indexes


def _strings(values: Any) -> list[str]:
    return [value for value in values if isinstance(value, str)] if isinstance(values, list) else []


def compile_evidence_table(
    scenario: dict[str, Any],
    packet: dict[str, Any],
    reader_outputs: dict[str, Any],
) -> dict[str, Any]:
    by = indexes(scenario)
    visible = set(row["observation_id"] for row in packet["visible_observations"])
    resources = set(row["resource_id"] for row in packet["eligible_resources"])
    targets = set(row["target_id"] for row in packet["eligible_targets"])
    unknowns = set(row["unknown_id"] for row in packet["required_unknowns"])
    invalid_references: list[dict[str, str]] = []

    incident = reader_outputs.get("incident_reader") or {}
    uncertainty = reader_outputs.get("uncertainty_reader") or {}
    resource = reader_outputs.get("resource_reader") or {}

    observation_ids: list[str] = []
    relevance: dict[str, str] = {}
    rows = incident.get("observation_rows", []) if isinstance(incident, dict) else []
    if isinstance(rows, list):
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("observation_id"), str):
                invalid_references.append({"kind": "MALFORMED_OBSERVATION_ROW", "value": repr(row)[:200]})
                continue
            observation_id = row["observation_id"]
            if observation_id not in visible:
                invalid_references.append({"kind": "INVALID_OBSERVATION_ID", "value": observation_id})
                continue
            if observation_id not in observation_ids:
                observation_ids.append(observation_id)
            relevance[observation_id] = str(row.get("relevance", ""))[:320]
    for observation_id in _strings(uncertainty.get("observation_ids", []) if isinstance(uncertainty, dict) else []):
        if observation_id not in visible:
            invalid_references.append({"kind": "INVALID_OBSERVATION_ID", "value": observation_id})
        elif observation_id not in observation_ids:
            observation_ids.append(observation_id)

    def retain_ids(values: Any, eligible: set[str], kind: str) -> list[str]:
        retained: list[str] = []
        for value in _strings(values):
            if value not in eligible:
                invalid_references.append({"kind": f"INVALID_{kind}_ID", "value": value})
            elif value not in retained:
                retained.append(value)
        return retained

    resource_ids = retain_ids(resource.get("resource_ids", []) if isinstance(resource, dict) else [], resources, "RESOURCE")
    target_ids = retain_ids(resource.get("target_ids", []) if isinstance(resource, dict) else [], targets, "TARGET")
    unknown_ids = retain_ids(uncertainty.get("unknown_ids", []) if isinstance(uncertainty, dict) else [], unknowns, "UNKNOWN")

    return {
        "schema_version": "kumamoto-real-response.evidence-table.v1",
        "decision_slot_id": packet["decision_slot_id"],
        "cutoff_at": packet["cutoff_at"],
        "observations": [
            {
                **dict(by["observations"][observation_id]),
                "reader_relevance": relevance.get(observation_id, "Retained by the uncertainty reader."),
            }
            for observation_id in observation_ids
        ],
        "omitted_observation_ids": sorted(visible - set(observation_ids)),
        "resources": [
            next(row for row in packet["eligible_resources"] if row["resource_id"] == resource_id)
            for resource_id in resource_ids
        ],
        "omitted_resource_ids": sorted(resources - set(resource_ids)),
        "targets": [
            next(row for row in packet["eligible_targets"] if row["target_id"] == target_id)
            for target_id in target_ids
        ],
        "omitted_target_ids": sorted(targets - set(target_ids)),
        "action_contract": dict(packet["action_contract"]),
        "required_unknowns": [dict(by["unknowns"][unknown_id]) for unknown_id in unknown_ids],
        "omitted_unknown_ids": sorted(unknowns - set(unknown_ids)),
        "assumption_notes": _strings(uncertainty.get("assumption_notes", []) if isinstance(uncertainty, dict) else []),
        "rule_notes": _strings(resource.get("rule_notes", []) if isinstance(resource, dict) else []),
        "invalid_reader_references": invalid_references,
    }


def historical_overlap(scenario: dict[str, Any], slot_id: str, decision: Any) -> dict[str, Any]:
    slot = indexes(scenario)["slots"][slot_id]
    historical = {
        (row["resource_id"], row["target_id"], row["quantity"])
        for row in slot["historical_choice"]["assignments"]
    }
    proposed = set()
    if isinstance(decision, dict) and isinstance(decision.get("assignments"), list):
        for row in decision["assignments"]:
            if isinstance(row, dict):
                proposed.add((row.get("resource_id"), row.get("target_id"), row.get("quantity")))
    overlap = historical.intersection(proposed)
    return {
        "classification": "DESCRIPTIVE_ONLY_NOT_A_SUCCESS_SCORE",
        "historical_assignment_count": len(historical),
        "proposed_assignment_count": len(proposed),
        "exact_assignment_overlap_count": len(overlap),
        "historical_summary": slot["historical_choice"]["summary"],
    }
