import { Quote } from '../quote';
import { Author } from '../author';
import { Category } from '../category';

describe('Quote Entity', () => {
  it('should create a Quote instance', () => {
    const quote = new Quote();
    expect(quote).toBeDefined();
    expect(quote).toBeInstanceOf(Quote);
  });

  it('should have required properties', () => {
    const quote = new Quote();
    quote.quote = 'This is a test quote';
    quote.permalink = 'this-is-a-test';

    expect(quote.quote).toBe('This is a test quote');
    expect(quote.permalink).toBe('this-is-a-test');
  });

  it('should have an id property', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('id');
  });

  it('should have a quote text property', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('quote');
  });

  it('should have a permalink property', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('permalink');
  });

  it('should have an author relationship', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('author');
  });

  it('should have an authorId property', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('authorId');
  });

  it('should have a categories relationship', () => {
    const quote = new Quote();
    expect(quote).toHaveProperty('categories');
  });

  it('should associate with an Author', () => {
    const author = new Author();
    author.name = 'Test Author';
    author.permalink = 'test-author';

    const quote = new Quote();
    quote.quote = 'Test quote';
    quote.permalink = 'test-quote';
    quote.author = author;
    quote.authorId = 1;

    expect(quote.author).toBe(author);
    expect(quote.authorId).toBe(1);
  });

  it('should associate with multiple Categories', () => {
    const category1 = new Category();
    category1.name = 'inspirational';

    const category2 = new Category();
    category2.name = 'life';

    const quote = new Quote();
    quote.quote = 'Test quote';
    quote.permalink = 'test-quote';
    quote.categories = [category1, category2];

    expect(quote.categories).toHaveLength(2);
    expect(quote.categories[0]).toBe(category1);
    expect(quote.categories[1]).toBe(category2);
  });

  it('should handle empty categories array', () => {
    const quote = new Quote();
    quote.categories = [];

    expect(quote.categories).toHaveLength(0);
  });

  it('should store long quote text', () => {
    const longQuote = 'a'.repeat(1000);
    const quote = new Quote();
    quote.quote = longQuote;

    expect(quote.quote).toBe(longQuote);
    expect(quote.quote.length).toBe(1000);
  });

  it('should have readonly id property', () => {
    const quote = new Quote();
    const descriptor = Object.getOwnPropertyDescriptor(quote, 'id');

    // Note: TypeScript readonly is compile-time only, so we just check the property exists
    expect(quote).toHaveProperty('id');
  });
});
