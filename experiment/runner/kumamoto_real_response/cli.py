from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from .manifest import create, validate
from .run import analyze, run_shard
from .scenario import indexes, load_scenario, safe_slot_packet
from .util import hash_obj


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the frozen Kumamoto real-response graph test.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("verify-input")

    freeze = subparsers.add_parser("freeze")
    freeze.add_argument("--out", type=Path, required=True)

    check_freeze = subparsers.add_parser("check-freeze")
    check_freeze.add_argument("--freeze", type=Path, required=True)

    run = subparsers.add_parser("run")
    run.add_argument("--phase", choices=("smoke", "production"), required=True)
    run.add_argument("--freeze", type=Path, required=True)
    run.add_argument("--out", type=Path, required=True)
    run.add_argument("--base-url", default="http://127.0.0.1:8000/v1")
    run.add_argument("--shard-index", type=int, default=0)
    run.add_argument("--shard-count", type=int, default=1)
    run.add_argument("--config-concurrency", type=int, default=1)
    run.add_argument("--call-concurrency", type=int, default=3)

    analysis = subparsers.add_parser("analyze")
    analysis.add_argument("--phase", choices=("smoke", "production"), required=True)
    analysis.add_argument("--freeze", type=Path, required=True)
    analysis.add_argument("--out", type=Path, required=True)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    if args.command == "verify-input":
        scenario = load_scenario()
        packets = [safe_slot_packet(scenario, slot_id) for slot_id in indexes(scenario)["slots"]]
        print(
            json.dumps(
                {
                    "passes": True,
                    "slot_count": len(packets),
                    "packet_hashes": {
                        packet["decision_slot_id"]: hash_obj(packet) for packet in packets
                    },
                },
                indent=2,
                sort_keys=True,
            )
        )
    elif args.command == "freeze":
        print(json.dumps(create(args.out), indent=2, sort_keys=True))
    elif args.command == "check-freeze":
        print(json.dumps(validate(args.freeze), indent=2, sort_keys=True))
    elif args.command == "run":
        if not 0 <= args.shard_index < args.shard_count:
            raise SystemExit("shard-index must be within shard-count")
        frozen = validate(args.freeze)["manifest"]
        summary = asyncio.run(
            run_shard(
                manifest=frozen,
                output=args.out,
                base_url=args.base_url,
                phase=args.phase,
                shard_index=args.shard_index,
                shard_count=args.shard_count,
                config_concurrency=args.config_concurrency,
                call_concurrency=args.call_concurrency,
            )
        )
        print(json.dumps(summary, indent=2, sort_keys=True))
    elif args.command == "analyze":
        frozen = validate(args.freeze)["manifest"]
        print(json.dumps(analyze(args.out, frozen, phase=args.phase), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
