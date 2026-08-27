# Public data for the Kumamoto replay

This package uses a real place and real public observations, then adds a clearly labeled synthetic
exercise. It does not claim that the made-up reports, people counts, resources, dispatches, or
outcomes happened during the real earthquake.

## Ready now

| Layer | What it gives the demonstration | Status |
|---|---|---|
| JMA earthquake record | Origin time, epicenter, depth, current magnitude **M7.1**, and observed intensity | Linked from the scenario manifest |
| JMA official earthquake feed | Seven successive reports over four hours plus 1,248 geolocated station readings | Normalized and bundled with every detail-file hash |
| JMA Uki/Toyono strong-motion record | A real maximum-intensity-7 station waveform and acceleration measurements | Linked, not redistributed |
| GSI 2026 landslide/deposition GeoJSON | 35 real post-event polygons interpreted from aerial photographs | Normalized and bundled with exact source ZIP hash |
| MLIT Passable Map, 2026-07-29 12:00 | 29 real reported road restrictions, including rockfall, road damage, and bridge damage | Normalized and bundled with exact source ZIP hash |
| GSI elevation tiles | Real terrain height for the 3D world | 12 DEM10B tiles stitched into one 612×917 lossless local terrain asset |
| GSI Uki designated locations | 45 designated-shelter records and 47 earthquake-compatible evacuation-place records | 92 designations at 56 unique coordinates; event status remains unknown |
| PLATEAU Uki City 2025 | Buildings and roads as 3D Tiles/MVT | Official archive hashed; nine LOD1 building tiles (3.77 MB) bundled around the epicenter |
| PLATEAU Uki related data | Shelter and emergency-route GeoJSON | Exact official download identified; not bundled yet |

Authoritative source pages:

- JMA event and station data: <https://www.data.jma.go.jp/eqev/data/kyoshin/jishin/2607281627_kumamoto/>
- JMA machine-readable earthquake feed: <https://www.jma.go.jp/bosai/quake/data/list.json>
- GSI incident hub: <https://www.gsi.go.jp/BOUSAI/20260728_kumamoto_earthquake.html>
- GSI landslide/deposition ZIP: <https://www1.gsi.go.jp/geowww/saigai/20260728_kumamoto/hokai/kumamoto_yatsushiro0814.zip>
- GSI elevation-tile specification: <https://maps.gsi.go.jp/development/demtile.html>
- MLIT Kumamoto Passable Map: <https://www.mlit.go.jp/road/saigai/r8kumamoto/index.html>
- Frozen MLIT 2026-07-29 12:00 snapshot: <https://www.mlit.go.jp/road/saigai/r8kumamoto/2607291200data.zip>
- MLIT PLATEAU open-data list: <https://www.mlit.go.jp/plateau/open-data/>
- Uki 2025 PLATEAU 3D Tiles/MVT: <https://assets.cms.plateau.reearth.io/assets/c3/6b9e5c-cbdc-415a-9ac1-601df5f79fd4/43213_uki-shi_city_2025_3dtiles_mvt_1_op.zip>
- Uki 2025 PLATEAU shelters/emergency routes: <https://assets.cms.plateau.reearth.io/assets/a9/371c8e-96c6-40fa-8a00-8eb4232bd88f/43213_uki-shi_2025_related.zip>

The JMA event metadata, GSI layers, MLIT Passable Map, and PLATEAU data are public under the
applicable Japan Public Data License 1.0 terms. Attribution and our processing must be stated.
Raw JMA strong-motion files have additional rules: this repository links them but does not vendor
them. A public visualization should use a documented derivative, credit JMA, and follow the special
station-data conditions on JMA's source page.

The Uki PLATEAU 3D Tiles/MVT archive fetched from the official URL above is 178,313,067 bytes with
SHA-256 `d271ce2a6e0e337cd7d8e913ee498832e7719e3cd86fa006c84036346c8385a8`.
The archive itself contains geometry and tileset metadata but no embedded license file. Its
catalog record points to the PLATEAU Site Policy; Uki City owns the municipal 3D model and the
open-data terms allow reuse with attribution. AURAWORLD commits only the nine-tile coverage frontier
inside `[130.665, 32.612, 130.691, 32.638]`, not the full 170 MiB archive. The derived local tileset
and every content hash live under `data/plateau-uki-2025-focus/`. These are real pre-event building
geometries; they do not show earthquake damage, occupancy, safety, or rescue need.

The real terrain asset is `data/gsi-dem10b-z11-kumamoto.png`, a lossless crop of 12 official GSI
DEM10B tiles at zoom 11. Its 612×917 pixels cover the scenario window at roughly 64 metres per
sample and hash to `6b74fb52109fcb70f8667fede283e2134b3b51032d616d8c51722599d4e429ca`.
`data/gsi-dem10b-z11-kumamoto.meta.json` retains every tile URL, tile hash, exact crop, decode rule,
and caveat. It is general basemap elevation—not post-earthquake deformation, building height, or
survey-grade engineering data.

`data/jma-2026-kumamoto-official-updates.json` freezes the seven official reports issued at 16:28,
16:29, 16:30, 16:31 (two report types), 16:35, and 20:30 JST. The reports grow from quick intensity
bulletins into a 1,248-station picture and a later hypocenter revision. That is real evidence
revision, not a synthetic rescue report and not a forecast. The importer retains the SHA-256 of
every source detail file and rebuilds the normalized file deterministically.

## Important source correction

The current JMA record gives **M7.1**. If an early SpaceData screenshot shows **M6.8**, the two
numbers must not be silently merged. The replay uses the current JMA value and can label the older
number only as an earlier/demo reading if it is shown at all.

## What stays synthetic

The exercise uses eight made-up reports at four real GSI-mapped hazard polygons. Their people
counts and the two assessment-team outcomes exist only to make the graph behavior visible. That
lets us test whether the renderer, claim-versioning, evidence gate, dispatch receipts, and replay
work without inventing private response records or turning public map geometry into fake history.

## Strong next layers

The next real-data additions, in order, are:

1. GSI's event orthophoto layer, whose Uki-area tile template is
   `https://maps.gsi.go.jp/xyz/20260729kumamoto_kumamoto4_0730do/{z}/{x}/{y}.png`. The complete
   official event-layer definitions live at
   <https://maps.gsi.go.jp/layers_txt/layers_20260729kumamoto.txt>.
2. GSI's published ALOS-2/ALOS-4 SAR analysis at
   <https://www.gsi.go.jp/uchusokuchi/20260728kumamoto.html>, using the required GSI/JAXA credit.
   It shows inferred surface displacement, not a building-collapse map.

The GSI landslide polygons are official **aerial-image interpretations**, not field confirmations.
The source warns that clouds, image limits, false positives, missed sites, and a roughly 30-meter
feature threshold affect them. The MLIT road restrictions are real reported restrictions at one
timestamp; they do not prove every other road was open. Emergency-route designation does not prove
passability.

## Acquisition rule

Run `node scripts/import-public-data.mjs` to refresh the small GSI layer. The importer rejects the
download unless the official ZIP still has SHA-256
`8133f7cb714990cc5b9fe6bfb10fb991009a413569a4468b3ffe8686c0532531`. If GSI publishes a new
revision, review it and update the source record deliberately; do not bypass the hash check.
The same importer extracts only the public `dourokisei.geojson` road-restriction layer from the
MLIT snapshot and pins its source ZIP to SHA-256
`8dd8cf569879e68ae392ba6b4e26263d1f3ba8c758b09d85dcad6cfae8b62d84`. It deliberately leaves
the large ETC2.0 probe-speed layer out until its third-party rights are separately confirmed.

Before bundling the larger PLATEAU packages, retain their metadata and included license files and
record exact archive hashes. Do not scrape or replay identifiable social-media posts. Use synthetic
exercise posts unless an authorized, privacy-reviewed incident dataset is provided.

Do not vendor MLIT's ETC2.0 probe-speed or private-probe layers until their third-party rights are
confirmed separately. Do not describe this replay as a reproduction of SpaceData's private system,
their satellite damage model, or their one-hour target. It is a category-level local replay built
from public sources and inspired by their public demonstration.
