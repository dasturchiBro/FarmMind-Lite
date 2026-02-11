/**
 * Normalize crop name from API to i18n key (lowercase, single spaces).
 * @param {string} name - Crop name e.g. "Bell Pepper", "Wheat"
 * @returns {string} Key e.g. "bell pepper", "wheat"
 */
export function cropNameToKey(name) {
  if (!name || typeof name !== 'string') return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get translated crop name. Use with useTranslation: getTranslatedCropName(t, name).
 * Falls back to original name if no translation exists.
 */
export function getTranslatedCropName(t, name) {
  if (!name) return '';
  const key = cropNameToKey(name);
  if (!key) return name;
  const translated = t(`crops.${key}`);
  return translated && translated !== `crops.${key}` ? translated : name;
}
