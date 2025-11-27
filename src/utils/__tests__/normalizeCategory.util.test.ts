import { normalizeCategory } from '../normalizeCategory.util';

describe('normalizeCategory', () => {
  it('should convert to lowercase', () => {
    const input = 'INSPIRATIONAL';
    const expected = 'inspirational';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should convert mixed case to lowercase', () => {
    const input = 'Self-Love';
    const expected = 'self love';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should replace hyphens with spaces', () => {
    const input = 'self-love';
    const expected = 'self love';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should replace underscores with spaces', () => {
    const input = 'life_lessons';
    const expected = 'life lessons';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should replace multiple hyphens with single spaces', () => {
    const input = 'self--love--quotes';
    const expected = 'self love quotes';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should handle mixed hyphens and underscores', () => {
    const input = 'self-love_and_life';
    const expected = 'self love and life';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should remove multiple spaces', () => {
    const input = 'love   and    life';
    const expected = 'love and life';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should trim leading and trailing whitespace', () => {
    const input = '  love  ';
    const expected = 'love';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should handle all transformations together', () => {
    const input = '  Self-Love_And-Happiness  ';
    const expected = 'self love and happiness';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(normalizeCategory('')).toBe('');
  });

  it('should handle single word categories', () => {
    const input = 'Love';
    const expected = 'love';
    expect(normalizeCategory(input)).toBe(expected);
  });

  it('should preserve spaces in multi-word categories', () => {
    const input = 'Love And Life';
    const expected = 'love and life';
    expect(normalizeCategory(input)).toBe(expected);
  });
});
