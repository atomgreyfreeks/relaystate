# Data, claims, and attribution

Rescue World combines three clearly separated layers:

1. Recorded public information about the July 2026 Kumamoto earthquake and response.
2. Explicitly simulated stand-in agent decisions made from information available by fixed deadlines.
3. Later analysis of how recorded AI workflows followed prewritten rules and whether one exact
   action-card handoff was completed.

The simulation must not be described as a reconstruction of private responder reasoning. The
experiment must not be described as evidence about real responder judgment, real dispatches,
people reached, or lives saved. The focused accepted result concerns one follow-up across eight
saved histories from one modeled incident, tested with two models from the Qwen family.

Official data came from Japan's public agencies, including JMA, MLIT, the Geospatial Information
Authority of Japan, and Japan's e-Stat portal. Exact URLs, snapshots, transformations, hashes,
license notes, and attribution language are in `product/disaster-replay/DATA-SOURCES.md` and the
metadata files beside each normalized asset.

The package intentionally excludes private infrastructure access. It contains no VPN key, server
password, private launch script, or remote execution endpoint.
