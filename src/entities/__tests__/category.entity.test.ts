import { Category } from '../category';

describe('Category Entity', () => {
  it('should create a Category instance', () => {
    const category = new Category();
    expect(category).toBeDefined();
    expect(category).toBeInstanceOf(Category);
  });

  it('should have required properties', () => {
    const category = new Category();
    category.name = 'inspirational';

    expect(category.name).toBe('inspirational');
  });

  it('should have an id property', () => {
    const category = new Category();
    expect(category).toHaveProperty('id');
  });

  it('should have a name property', () => {
    const category = new Category();
    expect(category).toHaveProperty('name');
  });

  it('should set category name correctly', () => {
    const category = new Category();
    category.name = 'love';

    expect(category.name).toBe('love');
  });

  it('should handle lowercase category names', () => {
    const category = new Category();
    category.name = 'life';

    expect(category.name).toBe('life');
  });

  it('should handle multi-word category names', () => {
    const category = new Category();
    category.name = 'self love';

    expect(category.name).toBe('self love');
  });

  it('should handle category names with spaces', () => {
    const category = new Category();
    category.name = 'life lessons';

    expect(category.name).toBe('life lessons');
  });

  it('should handle single word categories', () => {
    const category = new Category();
    category.name = 'happiness';

    expect(category.name).toBe('happiness');
  });

  it('should handle category names from normalized input', () => {
    const category = new Category();
    // Simulating normalized category from "Self-Love"
    category.name = 'self love';

    expect(category.name).toBe('self love');
  });

  it('should handle category names from CSV data', () => {
    const category = new Category();
    // Original CSV might have "attributed-no-source" which normalizes to "attributed no source"
    category.name = 'attributed no source';

    expect(category.name).toBe('attributed no source');
  });

  it('should have readonly id property', () => {
    const category = new Category();

    // Note: TypeScript readonly is compile-time only, so we just check the property exists
    expect(category).toHaveProperty('id');
  });

  it('should allow updating name property', () => {
    const category = new Category();
    category.name = 'love';

    expect(category.name).toBe('love');

    category.name = 'life';
    expect(category.name).toBe('life');
  });

  it('should handle empty string name', () => {
    const category = new Category();
    category.name = '';

    expect(category.name).toBe('');
  });

  it('should handle category names with numbers', () => {
    const category = new Category();
    category.name = 'top 10';

    expect(category.name).toBe('top 10');
  });

  it('should create multiple distinct categories', () => {
    const category1 = new Category();
    category1.name = 'love';

    const category2 = new Category();
    category2.name = 'life';

    expect(category1.name).toBe('love');
    expect(category2.name).toBe('life');
    expect(category1).not.toBe(category2);
  });
});
