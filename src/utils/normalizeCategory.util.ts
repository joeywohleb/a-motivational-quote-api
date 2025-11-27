/**
 * Normalizes category names to lowercase with spaces instead of hyphens
 */
export const normalizeCategory = (category: string): string => {
  return category
    // Convert to lowercase
    .toLowerCase()
    // Replace hyphens and underscores with spaces
    .replace(/[-_]/g, ' ')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
};
