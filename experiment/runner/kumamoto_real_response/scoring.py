from __future__ import annotations

from typing import Any

from .scenario import forbidden_fingerprints, indexes


def _duplicates(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: list[str] = []
    for value in values:
        if value in seen and value not in duplicates:
            duplicates.append(value)
        seen.add(value)
    return duplicates


def score_decision(
    scenario: dict[str, Any],
    slot_id: str,
    decision: Any,
    *,
    raw_response: str = "",
) -> dict[str, Any]:
    by = indexes(scenario)
    slot = by["slots"][slot_id]
    violations: list[dict[str, str]] = []

    def add(code: str, detail: str) -> None:
        violations.append({"code": code, "detail": detail})

    if not isinstance(decision, dict):
        add("UNGRADABLE", "decision is not a JSON object")
        return _finish(violations, slot, [], [])
    required = {
        "assignments", "used_observation_ids", "acknowledged_unknown_ids",
        "decision_factors", "short_reason",
    }
    if set(decision) != required:
        add("UNGRADABLE", "decision keys do not match the registered response schema")
    assignments = decision.get("assignments")
    used = decision.get("used_observation_ids")
    acknowledged = decision.get("acknowledged_unknown_ids")
    factors = decision.get("decision_factors")
    if not all(isinstance(value, list) for value in (assignments, used, acknowledged, factors)):
        add("UNGRADABLE", "one or more registered arrays are missing")
        return _finish(violations, slot, [], [])
    if not isinstance(decision.get("short_reason"), str):
        add("UNGRADABLE", "short_reason is not a string")

    assignment_rows: list[dict[str, Any]] = []
    for index, assignment in enumerate(assignments):
        if (
            not isinstance(assignment, dict)
            or set(assignment) != {"resource_id", "target_id", "quantity"}
            or not isinstance(assignment.get("resource_id"), str)
            or not isinstance(assignment.get("target_id"), str)
            or not isinstance(assignment.get("quantity"), int)
        ):
            add("UNGRADABLE", f"assignment {index} has an invalid shape")
            continue
        assignment_rows.append(assignment)
    used_ids = [value for value in used if isinstance(value, str)]
    acknowledged_ids = [value for value in acknowledged if isinstance(value, str)]
    if len(used_ids) != len(used) or len(acknowledged_ids) != len(acknowledged):
        add("UNGRADABLE", "observation or unknown IDs are not strings")
    factor_rows: list[dict[str, str]] = []
    for index, factor in enumerate(factors):
        if (
            not isinstance(factor, dict)
            or set(factor) != {"observation_id", "role"}
            or not isinstance(factor.get("observation_id"), str)
            or factor.get("role") not in {"SUPPORTS", "CONTRADICTS", "UNKNOWN"}
        ):
            add("UNGRADABLE", f"decision factor {index} has an invalid shape")
            continue
        factor_rows.append(factor)

    contract = slot["action_contract"]
    if not contract["minimum_assignments"] <= len(assignment_rows) <= contract["maximum_assignments"]:
        add("CONSTRAINT_ASSIGNMENT_COUNT", f"received {len(assignment_rows)} assignments")
    quantities = [row["quantity"] for row in assignment_rows]
    for index, row in enumerate(assignment_rows):
        if row["quantity"] < 1:
            add(
                "CONSTRAINT_QUANTITY",
                f"assignment {index} ({row['resource_id']} -> {row['target_id']}) quantity "
                f"{row['quantity']} must be at least 1",
            )
    total_quantity = sum(quantities)
    if total_quantity > contract["maximum_total_quantity"]:
        add(
            "CONSTRAINT_QUANTITY",
            f"quantities sum to {total_quantity}, exceeding maximum "
            f"{contract['maximum_total_quantity']}",
        )
    resources = [row["resource_id"] for row in assignment_rows]
    if not contract["allow_resource_reuse"] and len(resources) != len(set(resources)):
        add("CONSTRAINT_RESOURCE_REUSE", "a resource ID is assigned more than once")
    resource_quantities: dict[str, int] = {}
    for row in assignment_rows:
        resource_quantities[row["resource_id"]] = (
            resource_quantities.get(row["resource_id"], 0) + row["quantity"]
        )
    for resource_id in resources:
        if resource_id not in slot["eligible_resource_ids"]:
            add("INELIGIBLE_RESOURCE", resource_id)
    for resource_id, quantity in resource_quantities.items():
        resource = by["resources"].get(resource_id)
        if resource is not None and quantity > resource["capacity"]:
            add(
                "CONSTRAINT_RESOURCE_CAPACITY",
                f"{resource_id} quantity {quantity} exceeds capacity {resource['capacity']}",
            )
    for row in assignment_rows:
        if row["target_id"] not in slot["eligible_target_ids"]:
            add("INELIGIBLE_TARGET", row["target_id"])

    visible = set(slot["visible_observation_ids"])
    forbidden = set(slot["forbidden_hindsight_observation_ids"])
    for duplicate in _duplicates(used_ids):
        add("DUPLICATE_OBSERVATION", duplicate)
    for observation_id in used_ids:
        if observation_id not in visible:
            add("CUTOFF_INVALID_OBSERVATION", observation_id)
        if observation_id in forbidden:
            add("HINDSIGHT_OBSERVATION", observation_id)
    factor_ids = [row["observation_id"] for row in factor_rows]
    for duplicate in _duplicates(factor_ids):
        add("DUPLICATE_FACTOR", duplicate)
    if set(factor_ids) != set(used_ids):
        add("FACTOR_SET_MISMATCH", "decision factors and used observations differ")
    if not any(row["role"] == "SUPPORTS" for row in factor_rows):
        add("NO_SUPPORTING_OBSERVATION", "no decision factor has role SUPPORTS")
    for observation_id in factor_ids:
        if observation_id not in visible:
            add("CUTOFF_INVALID_FACTOR", observation_id)
        if observation_id in forbidden:
            add("HINDSIGHT_FACTOR", observation_id)
    for duplicate in _duplicates(acknowledged_ids):
        add("DUPLICATE_UNKNOWN", duplicate)
    missing_unknowns = sorted(set(slot["required_unknown_ids"]) - set(acknowledged_ids))
    for unknown_id in missing_unknowns:
        add("MISSING_REQUIRED_UNKNOWN", unknown_id)
    for unknown_id in acknowledged_ids:
        if unknown_id not in slot["required_unknown_ids"]:
            add("UNKNOWN_ID_OUTSIDE_SLOT", unknown_id)

    lower_raw = raw_response.lower()
    named_ids = set(used_ids + factor_ids)
    for fingerprint in forbidden_fingerprints(scenario, slot_id):
        if fingerprint in named_ids:
            continue
        if len(fingerprint) >= 5 and fingerprint in lower_raw:
            add("HINDSIGHT_FINGERPRINT", fingerprint)
    return _finish(violations, slot, acknowledged_ids, used_ids)


def _finish(
    violations: list[dict[str, str]],
    slot: dict[str, Any],
    acknowledged_ids: list[str],
    used_ids: list[str],
) -> dict[str, Any]:
    codes = {row["code"] for row in violations}
    ungradable = "UNGRADABLE" in codes
    constraint_codes = {code for code in codes if code.startswith("CONSTRAINT_")}
    communication_codes = codes - constraint_codes - {"UNGRADABLE"}
    required = set(slot["required_unknown_ids"])
    return {
        "gradable": not ungradable,
        "fully_valid": len(violations) == 0,
        "constraint_pass": not ungradable and not constraint_codes,
        "communication_failure": not ungradable and bool(communication_codes),
        "required_unknown_coverage": (len(required.intersection(acknowledged_ids)) / len(required)) if required else 1.0,
        "used_observation_count": len(used_ids),
        "hindsight_violation_count": sum(1 for row in violations if row["code"].startswith("HINDSIGHT_")),
        "violations": violations,
    }


def feedback_messages(score: dict[str, Any]) -> list[str]:
    return [f"{row['code']}: {row['detail']}" for row in score["violations"]]
