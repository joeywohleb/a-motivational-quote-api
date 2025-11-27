/**
 * Cleans quote text by removing unwanted symbols and normalizing formatting
 */
export const cleanQuote = (quote: string): string => {
  return quote
    // Remove zero-width characters and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize quotes to standard double quotes
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Normalize ellipsis
    .replace(/\u2026/g, '...')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();
};
