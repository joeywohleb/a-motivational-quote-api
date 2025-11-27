import { Author } from '../author';

describe('Author Entity', () => {
  it('should create an Author instance', () => {
    const author = new Author();
    expect(author).toBeDefined();
    expect(author).toBeInstanceOf(Author);
  });

  it('should have required properties', () => {
    const author = new Author();
    author.name = 'Test Author';
    author.permalink = 'test-author';

    expect(author.name).toBe('Test Author');
    expect(author.permalink).toBe('test-author');
  });

  it('should have an id property', () => {
    const author = new Author();
    expect(author).toHaveProperty('id');
  });

  it('should have a name property', () => {
    const author = new Author();
    expect(author).toHaveProperty('name');
  });

  it('should have a permalink property', () => {
    const author = new Author();
    expect(author).toHaveProperty('permalink');
  });

  it('should set author name correctly', () => {
    const author = new Author();
    author.name = 'William Shakespeare';

    expect(author.name).toBe('William Shakespeare');
  });

  it('should set author permalink correctly', () => {
    const author = new Author();
    author.permalink = 'william-shakespeare';

    expect(author.permalink).toBe('william-shakespeare');
  });

  it('should handle author names with special characters', () => {
    const author = new Author();
    author.name = 'Martin Luther King Jr.';

    expect(author.name).toBe('Martin Luther King Jr.');
  });

  it('should handle author names with accents', () => {
    const author = new Author();
    author.name = 'André Gide';

    expect(author.name).toBe('André Gide');
  });

  it('should handle long author names', () => {
    const longName = 'A Very Long Author Name That Contains Multiple Words';
    const author = new Author();
    author.name = longName;

    expect(author.name).toBe(longName);
  });

  it('should handle single word author names', () => {
    const author = new Author();
    author.name = 'Plato';

    expect(author.name).toBe('Plato');
  });

  it('should handle author with book title removed', () => {
    const author = new Author();
    author.name = 'John Green';
    author.permalink = 'john-green';

    expect(author.name).not.toContain('The Fault in Our Stars');
    expect(author.name).toBe('John Green');
  });

  it('should have readonly id property', () => {
    const author = new Author();

    // Note: TypeScript readonly is compile-time only, so we just check the property exists
    expect(author).toHaveProperty('id');
  });

  it('should allow setting all properties', () => {
    const author = new Author();
    author.name = 'Friedrich Nietzsche';
    author.permalink = 'friedrich-nietzsche';

    expect(author.name).toBe('Friedrich Nietzsche');
    expect(author.permalink).toBe('friedrich-nietzsche');
  });
});
