const CLOTHING_REALISM_SUFFIX = ' Preserve textile-specific weight, thickness, weave, seam construction, gravity-driven drape, compression at shoulders/elbows/waist/seat, realistic stretch only where the fabric allows it, small asymmetric wrinkles, restrained highlights, and no plastic-like smoothness or fashion-catalog perfection.';


export function enrichClothingPrompt(prompt = '') {
  const text = typeof prompt === 'string' ? prompt.trim() : '';
  if (!text) return text;
  return text.includes('textile-specific weight, thickness, weave') ? text : `${text}.${CLOTHING_REALISM_SUFFIX}`;
}
