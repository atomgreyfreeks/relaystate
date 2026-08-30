# Portable evidence for the Rescue World action-card finding

This directory lets a reviewer inspect and verify the two accepted focused runs from a
clean checkout. The original run directories contain every raw model call and remain outside Git;
the four JSON files here are exact copies of the accepted analysis and plan files.

`acceptance-manifest.json` binds each copy to:

- its complete-file SHA-256;
- the runner's embedded analysis or plan SHA-256;
- the exact model and revision; and
- the narrow claim boundary used in the presentations.

Run this from the repository root:

```bash
node app/scripts/bake-receipt-fork.mjs --check
```

The check verifies the manifest, the file hashes, the model identities, completion and provenance
flags, every per-history total, and the public data file used by Rescue World.

This is evidence for one focused handoff test in eight saved histories from the earthquake
exercise. It is not a new 72-hour campaign and does not claim real-world effects.
