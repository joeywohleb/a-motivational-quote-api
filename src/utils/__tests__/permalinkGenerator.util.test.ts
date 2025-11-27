import { permalinkGenerator } from '../permalinkGenerator.util';

describe('permalinkGenerator', () => {
  it('should convert to lowercase', () => {
    const input = 'Hello World';
    const expected = 'hello-world';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should replace spaces with hyphens', () => {
    const input = 'this is a test';
    const expected = 'this-is-a-test';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should remove non-alphanumeric characters', () => {
    const input = 'Hello, World!';
    const expected = 'hello-world';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should limit to default 5 words', () => {
    const input = 'one two three four five six seven';
    const expected = 'one-two-three-four-five';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should respect custom word count', () => {
    const input = 'one two three four five';
    const expected = 'one-two-three';
    expect(permalinkGenerator(input, 3)).toBe(expected);
  });

  it('should handle input with fewer words than limit', () => {
    const input = 'hello world';
    const expected = 'hello-world';
    expect(permalinkGenerator(input, 5)).toBe(expected);
  });

  it('should handle multiple spaces between words', () => {
    const input = 'hello    world    test';
    const expected = 'hello-world-test';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle special characters and punctuation', () => {
    const input = "I'm selfish, impatient and a little insecure.";
    const expected = 'im-selfish-impatient-and-a';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle quotes with apostrophes', () => {
    const input = "You've gotta dance like there's nobody watching";
    const expected = 'youve-gotta-dance-like-theres';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle quotes with periods', () => {
    const input = 'This is Dr. Seuss speaking to you.';
    const expected = 'this-is-dr-seuss-speaking';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle numbers in text', () => {
    const input = 'Test 123 with numbers 456';
    const expected = 'test-123-with-numbers-456';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should filter out empty strings from multiple punctuation', () => {
    const input = '!!Hello...World???';
    const expected = 'helloworld';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle leading and trailing spaces', () => {
    const input = '  hello world  ';
    const expected = 'hello-world';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle single word input', () => {
    const input = 'Hello';
    const expected = 'hello';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle empty string input', () => {
    const input = '';
    const expected = '';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle input with only special characters', () => {
    const input = '!@#$%^&*()';
    const expected = '';
    expect(permalinkGenerator(input)).toBe(expected);
  });

  it('should handle word count of 0', () => {
    const input = 'hello world test';
    const expected = '';
    expect(permalinkGenerator(input, 0)).toBe(expected);
  });

  it('should handle word count of 1', () => {
    const input = 'hello world test';
    const expected = 'hello';
    expect(permalinkGenerator(input, 1)).toBe(expected);
  });

  it('should handle author names', () => {
    const input = 'Martin Luther King Jr.';
    const expected = 'martin-luther-king';
    expect(permalinkGenerator(input, 3)).toBe(expected);
  });

  it('should handle quotes with commas', () => {
    const input = 'Love all, trust a few, do wrong to none.';
    const expected = 'love-all-trust-a-few';
    expect(permalinkGenerator(input)).toBe(expected);
  });
});
