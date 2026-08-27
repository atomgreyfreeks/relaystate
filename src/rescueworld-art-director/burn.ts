/** Source-level recolouring for Rescue World's baked damage point attributes. */
import * as THREE from "three";
import type { DamageField } from "../rescueworld/damage";

export type Rgb = readonly [number, number, number];

/**
 * Damage builds two point clouds: hard debris followed by pale dust. Their colours are static
 * GPU attributes because replay time only changes their visibility. Refresh those attributes
 * when the owner chooses a new burn colour; this changes presentation only, never replay data.
 */
export function recolorDamage(field: DamageField, burn: Rgb) {
  const [debris, dust] = field.objects;
  const debrisColor = debris?.geometry.getAttribute("aColor") as THREE.BufferAttribute | undefined;
  if (debrisColor) {
    for (let i = 0; i < debrisColor.count; i++) debrisColor.setXYZ(i, burn[0], burn[1], burn[2]);
    debrisColor.needsUpdate = true;
  }
  const dustColor = dust?.geometry.getAttribute("aColor") as THREE.BufferAttribute | undefined;
  if (dustColor) {
    const r = 0.55 + 0.45 * burn[0];
    const g = 0.52 + 0.30 * burn[1];
    const b = 0.56 + 0.16 * burn[2];
    for (let i = 0; i < dustColor.count; i++) dustColor.setXYZ(i, r, g, b);
    dustColor.needsUpdate = true;
  }
}

/**
 * The old fixed residue bytes were (152,52,19). These channel gains reproduce those bytes for
 * the original #ff7b3c and let the same warm ground field follow any new hue.
 */
export function residueRgb(burn: Rgb): [number, number, number] {
  return [152 * burn[0], 108 * burn[1], 81 * burn[2]];
}
