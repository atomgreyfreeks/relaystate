from __future__ import annotations

import asyncio
import json
import re
import time
from typing import Any

import httpx

from .util import hash_obj


TOP_P = 0.95

PLAIN_READER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": ["briefing"],
    "properties": {"briefing": {"type": "string", "minLength": 1, "maxLength": 5000}},
}

EVIDENCE_READER_SCHEMAS: dict[str, dict[str, Any]] = {
    "incident_reader": {
        "type": "object",
        "additionalProperties": False,
        "required": ["observation_rows"],
        "properties": {
            "observation_rows": {
                "type": "array",
                "maxItems": 32,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["observation_id", "relevance"],
                    "properties": {
                        "observation_id": {"type": "string"},
                        "relevance": {"type": "string", "maxLength": 320},
                    },
                },
            }
        },
    },
    "resource_reader": {
        "type": "object",
        "additionalProperties": False,
        "required": ["resource_ids", "target_ids", "rule_notes"],
        "properties": {
            "resource_ids": {"type": "array", "maxItems": 24, "items": {"type": "string"}},
            "target_ids": {"type": "array", "maxItems": 24, "items": {"type": "string"}},
            "rule_notes": {"type": "array", "maxItems": 12, "items": {"type": "string", "maxLength": 320}},
        },
    },
    "uncertainty_reader": {
        "type": "object",
        "additionalProperties": False,
        "required": ["observation_ids", "unknown_ids", "assumption_notes"],
        "properties": {
            "observation_ids": {"type": "array", "maxItems": 32, "items": {"type": "string"}},
            "unknown_ids": {"type": "array", "maxItems": 16, "items": {"type": "string"}},
            "assumption_notes": {"type": "array", "maxItems": 16, "items": {"type": "string", "maxLength": 320}},
        },
    },
}

DECISION_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "assignments",
        "used_observation_ids",
        "acknowledged_unknown_ids",
        "decision_factors",
        "short_reason",
    ],
    "properties": {
        "assignments": {
            "type": "array",
            "maxItems": 16,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["resource_id", "target_id", "quantity"],
                "properties": {
                    "resource_id": {"type": "string"},
                    "target_id": {"type": "string"},
                    "quantity": {"type": "integer"},
                },
            },
        },
        "used_observation_ids": {"type": "array", "maxItems": 32, "items": {"type": "string"}},
        "acknowledged_unknown_ids": {"type": "array", "maxItems": 16, "items": {"type": "string"}},
        "decision_factors": {
            "type": "array",
            "maxItems": 32,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["observation_id", "role"],
                "properties": {
                    "observation_id": {"type": "string"},
                    "role": {"type": "string", "enum": ["SUPPORTS", "CONTRADICTS", "UNKNOWN"]},
                },
            },
        },
        "short_reason": {"type": "string", "maxLength": 1000},
    },
}


ROLE_GUIDANCE = {
    "incident_reader": "Explain what the time-bounded observations do and do not establish.",
    "resource_reader": "Explain eligible resources, targets, quantities and action constraints.",
    "uncertainty_reader": "Preserve unresolved questions and declared exercise assumptions.",
}


def reader_prompt(role: str, packet: dict[str, Any], *, evidence: bool) -> list[dict[str, str]]:
    if evidence:
        formats = {
            "incident_reader": (
                "Return observation_rows with one row per useful observation. Copy only exact "
                "observation_id values and state its decision relevance. Do not merge IDs."
            ),
            "resource_reader": (
                "Return every eligible resource_id and target_id you carry forward plus concise "
                "rule_notes. Never invent an ID or change a capacity."
            ),
            "uncertainty_reader": (
                "Return every visible observation_id relevant to uncertainty, every required "
                "unknown_id, and assumption_notes. Missing values remain unresolved, never zero."
            ),
        }
        system = (
            "You are a specialist in an evidence-preserving disaster-response graph. "
            + ROLE_GUIDANCE[role]
            + " "
            + formats[role]
            + " Use only the supplied material and never infer a later event. Return one JSON object. /no_think"
        )
    else:
        system = (
            "You are a specialist in a conventional disaster-response agent graph. "
            + ROLE_GUIDANCE[role]
            + " Write an ordinary prose briefing for a downstream coordinator. Preserve exact IDs, "
            "times and limitations when they matter, but do not use a typed evidence table. Use only "
            "the supplied material and never infer a later event. Return {\"briefing\": \"...\"}. /no_think"
        )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(packet, ensure_ascii=False, sort_keys=True)},
    ]


def coordinator_prompt(packet: dict[str, Any], handoff: Any, *, evidence: bool) -> list[dict[str, str]]:
    system = (
        "You are the coordinator at the end of a disaster-response agent graph. Decide only from "
        "the specialist handoff. Obey the action contract and use only eligible resource and target "
        "IDs. Name every observation ID you use, bind each named observation to exactly one factor "
        "role, and acknowledge every required unresolved-question ID carried by the specialists. "
        "Missing information is unknown, never zero. Do not use later outcomes or guess unstated "
        "facts. Return assignments, used_observation_ids, acknowledged_unknown_ids, decision_factors "
        "and short_reason as one JSON object. /no_think"
    )
    user = {
        "decision_slot_id": packet["decision_slot_id"],
        "cutoff_at": packet["cutoff_at"],
        "task": packet["task"],
        "handoff_kind": "compiled evidence table" if evidence else "ordinary prose summaries",
        "specialist_handoff": handoff,
    }
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": json.dumps(user, ensure_ascii=False, sort_keys=True)},
    ]


def feedback_prompt(
    original_messages: list[dict[str, str]], raw_answer: str, violations: list[str]
) -> list[dict[str, str]]:
    return original_messages + [
        {"role": "assistant", "content": raw_answer},
        {
            "role": "user",
            "content": json.dumps(
                {
                    "mechanical_return": violations,
                    "instruction": (
                        "Revise only enough to fix these mechanical violations. Use the unchanged "
                        "evidence table above. Add no facts, resources, targets or preferences. Return "
                        "the complete corrected JSON object."
                    ),
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
        },
    ]


def _extract_json(text: str) -> Any:
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start < 0 or end <= start:
            raise ValueError("response contains no JSON object")
        return json.loads(cleaned[start : end + 1])


class Backend:
    def __init__(
        self,
        base_url: str,
        model: str,
        model_revision: str,
        *,
        temperature: float,
        top_p: float = TOP_P,
        timeout_seconds: float = 300.0,
        max_concurrency: int = 3,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.model_revision = model_revision
        self.temperature = temperature
        self.top_p = top_p
        self._client = httpx.AsyncClient(timeout=timeout_seconds)
        self._semaphore = asyncio.Semaphore(max_concurrency)

    async def close(self) -> None:
        await self._client.aclose()

    async def health(self) -> dict[str, Any]:
        response = await self._client.get(f"{self.base_url}/models")
        response.raise_for_status()
        body = response.json()
        models = [str(row.get("id")) for row in body.get("data", [])]
        if self.model not in models:
            raise RuntimeError(f"configured model {self.model!r} missing from endpoint models {models}")
        return {"base_url": self.base_url, "models": models, "effective_top_p": self.top_p}

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
    ) -> tuple[Any | None, list[dict[str, Any]]]:
        payload = {
            "model": self.model,
            "seed": request_seed,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "max_tokens": max_tokens,
            "messages": messages,
            "chat_template_kwargs": {"enable_thinking": False},
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "krr_" + re.sub(r"[^a-z0-9_]", "_", role.lower())[:48],
                    "strict": True,
                    "schema": response_schema,
                },
            },
        }
        body_hash = hash_obj(payload)
        records: list[dict[str, Any]] = []
        for attempt in (1, 2):
            started = time.perf_counter()
            status = 0
            raw = ""
            parsed = None
            usage: dict[str, Any] = {}
            error: str | None = None
            retryable = False
            try:
                async with self._semaphore:
                    response = await self._client.post(
                        f"{self.base_url}/chat/completions", json=payload
                    )
                status = response.status_code
                retryable = status >= 500
                response.raise_for_status()
                response_body = response.json()
                raw = str(
                    response_body.get("choices", [{}])[0].get("message", {}).get("content", "")
                )
                usage = response_body.get("usage", {}) or {}
                parsed = _extract_json(raw)
            except httpx.TransportError as exc:
                error = f"{type(exc).__name__}: {exc}"
                retryable = True
            except Exception as exc:
                error = f"{type(exc).__name__}: {exc}"
                if status and not raw:
                    try:
                        raw = response.text[:4000]
                    except Exception:
                        raw = ""
            record = {
                "schema_version": 1,
                "request_id": request_id,
                "request_body_sha256": body_hash,
                "request_body": payload,
                "role": role,
                "context": context,
                "attempt": attempt,
                "request_seed": request_seed,
                "model": self.model,
                "model_revision": self.model_revision,
                "base_url": self.base_url,
                "http_status": status,
                "raw_response": raw,
                "parsed_response": parsed,
                "valid_json": parsed is not None,
                "error": error,
                "usage": usage,
                "latency_seconds": round(time.perf_counter() - started, 6),
            }
            records.append(record)
            if parsed is not None:
                return parsed, records
            if not retryable or attempt == 2:
                return None, records
        return None, records
