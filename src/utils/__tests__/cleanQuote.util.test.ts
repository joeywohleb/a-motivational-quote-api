import { cleanQuote } from '../cleanQuote.util';

describe('cleanQuote', () => {
  it('should remove zero-width characters', () => {
    const input = 'Test\u200Bquote\u200Cwith\u200Dinvisible\uFEFFchars';
    const expected = 'Testquotewithinvisiblechars';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should normalize curly quotes to standard quotes', () => {
    const input = '"Hello" and "World"';
    const expected = '"Hello" and "World"';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should normalize curly apostrophes to standard apostrophes', () => {
    const input = 'It\u2019s a quote with \u2018smart\u2019 apostrophes';
    const expected = 'It\'s a quote with \'smart\' apostrophes';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should normalize ellipsis character to three dots', () => {
    const input = 'Wait for it…';
    const expected = 'Wait for it...';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should remove multiple spaces', () => {
    const input = 'Quote   with    multiple     spaces';
    const expected = 'Quote with multiple spaces';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should trim leading and trailing whitespace', () => {
    const input = '   Quote with spaces   ';
    const expected = 'Quote with spaces';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should handle multiple transformations at once', () => {
    const input = '  "Test"  quote…  with   everything  ';
    const expected = '"Test" quote... with everything';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should return empty string for empty input', () => {
    expect(cleanQuote('')).toBe('');
  });

  it('should handle quote with only whitespace', () => {
    const input = '     ';
    const expected = '';
    expect(cleanQuote(input)).toBe(expected);
  });

  it('should preserve newlines and tabs', () => {
    const input = 'Line one\nLine two\tTabbed';
    const expected = 'Line one Line two Tabbed';
    expect(cleanQuote(input)).toBe(expected);
  });
});
