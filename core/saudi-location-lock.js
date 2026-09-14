export const SAUDI_NO_LANDMARKS_LOCK = 'SAUDI LOCATION LOCK — CRITICAL: Every Saudi Arabian scene must use an ordinary, non-iconic, non-identifiable location. Do not depict, imply, reconstruct, or place in the background any recognizable landmark, famous tower, monument, tourist attraction, famous mosque or holy site, signature skyline, named venue, uniquely identifiable facade, government landmark, or location-defining sign. A selected city may influence only regional atmosphere, climate, road character, building style, vegetation, and everyday urban texture. It must never introduce a recognizable landmark. Keep signage generic and secondary, and unreadable where practical.';

export function enforceSaudiNoLandmarks(location) {
  const base = typeof location === 'string' ? location.trim() : '';
  if (!base) return '';
  if (base.includes('ordinary, non-iconic, non-identifiable Saudi setting')) return base;
  return `${base}. Keep this as an ordinary, non-iconic, non-identifiable Saudi setting with no recognizable landmarks, famous towers, monuments, tourist attractions, holy sites, signature skyline elements, named venues, uniquely identifiable facades, government landmarks, or location-defining signage.`;
}

export function mergeSaudiNoLandmarksConstraint(customConstraints) {
  const custom = typeof customConstraints === 'string' ? customConstraints.trim() : '';
  if (!custom) return SAUDI_NO_LANDMARKS_LOCK;
  if (custom.includes('SAUDI LOCATION LOCK — CRITICAL')) return custom;
  return `${SAUDI_NO_LANDMARKS_LOCK}\n\n${custom}`;
}
