/**
 * Normalizes author names to handle variations, misspellings, and inconsistent formatting
 */
export const normalizeAuthorName = (authorName: string): string => {
  let normalized = authorName
    // Remove zero-width characters and other invisible characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize ellipsis
    .replace(/…/g, '...')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Trim whitespace
    .trim();

  // Remove common variations in book titles and suffixes
  // e.g., "Author, Book Title" becomes just "Author"
  // but preserve "Jr.", "Sr.", "PhD", etc.
  const parts = normalized.split(',').map(p => p.trim());

  // If there's a comma, check if the second part looks like a book title
  if (parts.length > 1) {
    const secondPart = parts[1].toLowerCase();
    const preservedSuffixes = ['jr', 'jr.', 'sr', 'sr.', 'phd', 'ph.d', 'md', 'm.d', 'esq', 'esq.', 'ii', 'iii', 'iv'];

    // If the second part is NOT a preserved suffix, assume it's a book title and remove it
    if (!preservedSuffixes.includes(secondPart)) {
      normalized = parts[0];
    }
  }

  // Title case the name properly
  normalized = normalized
    .split(' ')
    .map(word => {
      // Skip title-casing for certain particles
      const lowerCaseWords = ['de', 'del', 'la', 'von', 'van', 'der'];
      if (lowerCaseWords.includes(word.toLowerCase()) && word === word.toLowerCase()) {
        return word.toLowerCase();
      }

      // Preserve words that are already mixed case (like "von Neumann")
      if (word.length > 1 && word !== word.toUpperCase() && word !== word.toLowerCase()) {
        return word;
      }

      // Title case the word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return normalized;
};

/**
 * Creates a normalized key for author comparison to group similar names
 */
export const getAuthorKey = (authorName: string): string => {
  return normalizeAuthorName(authorName)
    // Remove all punctuation and special characters
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, '')
    // Convert to lowercase
    .toLowerCase()
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};
