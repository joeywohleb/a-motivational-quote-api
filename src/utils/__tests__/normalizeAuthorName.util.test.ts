import { normalizeAuthorName, getAuthorKey } from '../normalizeAuthorName.util';

describe('normalizeAuthorName', () => {
  it('should remove zero-width characters', () => {
    const input = 'John\u200B Doe';
    const expected = 'John Doe';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should normalize curly quotes', () => {
    const input = '"Author" Name';
    const expected = '"Author" Name';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should normalize ellipsis', () => {
    const input = 'Author…';
    const expected = 'Author...';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should remove book titles after comma', () => {
    const input = 'John Green, The Fault in Our Stars';
    const expected = 'John Green';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve Jr. suffix', () => {
    const input = 'Martin Luther King, Jr.';
    const expected = 'Martin Luther King, Jr.';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve Sr. suffix', () => {
    const input = 'John Smith, Sr.';
    const expected = 'John Smith, Sr.';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve PhD suffix', () => {
    const input = 'Jane Doe, PhD';
    const expected = 'Jane Doe, PhD';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should title case names properly', () => {
    const input = 'john doe';
    const expected = 'John Doe';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve particles like "von" in lowercase', () => {
    const input = 'ludwig von beethoven';
    const expected = 'Ludwig von Beethoven';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve particles like "van" in lowercase', () => {
    const input = 'vincent van gogh';
    const expected = 'Vincent van Gogh';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve particles like "de" in lowercase', () => {
    const input = 'leonardo de vinci';
    const expected = 'Leonardo de Vinci';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should handle all caps names', () => {
    const input = 'JOHN DOE';
    const expected = 'John Doe';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should preserve mixed case names', () => {
    const input = 'McDonald';
    const expected = 'McDonald';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should trim whitespace', () => {
    const input = '  John Doe  ';
    const expected = 'John Doe';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should handle complex author name with book title', () => {
    const input = 'Pablo Neruda, 100 Love Sonnets';
    const expected = 'Pablo Neruda';
    expect(normalizeAuthorName(input)).toBe(expected);
  });

  it('should remove multiple spaces', () => {
    const input = 'John   Doe';
    const expected = 'John Doe';
    expect(normalizeAuthorName(input)).toBe(expected);
  });
});

describe('getAuthorKey', () => {
  it('should remove all punctuation', () => {
    const input = 'Dr. Seuss';
    const expected = 'dr seuss';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should convert to lowercase', () => {
    const input = 'John Doe';
    const expected = 'john doe';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should remove book titles and normalize', () => {
    const input = 'John Green, The Fault in Our Stars';
    const expected = 'john green';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should group similar author variations', () => {
    const name1 = 'Dr. Seuss';
    const name2 = 'Dr Seuss';
    const name3 = 'dr. seuss';

    expect(getAuthorKey(name1)).toBe(getAuthorKey(name2));
    expect(getAuthorKey(name2)).toBe(getAuthorKey(name3));
  });

  it('should group author names with different punctuation', () => {
    const name1 = "Martin Luther King, Jr.";
    const name2 = "Martin Luther King Jr";
    const name3 = "Martin Luther King, Jr";

    expect(getAuthorKey(name1)).toBe(getAuthorKey(name2));
    expect(getAuthorKey(name2)).toBe(getAuthorKey(name3));
  });

  it('should trim and remove extra spaces', () => {
    const input = '  John   Doe  ';
    const expected = 'john doe';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should handle names with apostrophes', () => {
    const input = "O'Brien";
    const expected = 'obrien';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should handle names with hyphens', () => {
    const input = 'Jean-Paul Sartre';
    const expected = 'jeanpaul sartre';
    expect(getAuthorKey(input)).toBe(expected);
  });

  it('should produce consistent keys for similar names', () => {
    const variations = [
      'Friedrich Nietzsche',
      'friedrich nietzsche',
      'FRIEDRICH NIETZSCHE',
      'Friedrich  Nietzsche'
    ];

    const keys = variations.map(getAuthorKey);
    keys.forEach(key => expect(key).toBe(keys[0]));
  });
});
