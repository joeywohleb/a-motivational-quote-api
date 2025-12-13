import { QuoteResolver } from '../quote.resolvers';
import { dataSource } from '../../datasource';
import { Author, Category, Quote } from '../../entities';
import { Repository } from 'typeorm';

// Mock the datasource
jest.mock('../../datasource', () => ({
  dataSource: {
    getRepository: jest.fn(),
  },
}));

describe('QuoteResolver', () => {
  let quoteResolver: QuoteResolver;
  let mockQuoteRepository: jest.Mocked<Repository<Quote>>;
  let mockAuthorRepository: jest.Mocked<Repository<Author>>;
  let mockCategoryRepository: jest.Mocked<Repository<Category>>;

  beforeEach(() => {
    // Create mock repositories
    mockQuoteRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    mockAuthorRepository = {
      findOne: jest.fn(),
    } as any;

    mockCategoryRepository = {} as any;

    // Mock getRepository to return our mock repositories
    (dataSource.getRepository as jest.Mock).mockImplementation((entity) => {
      if (entity === Quote) return mockQuoteRepository;
      if (entity === Author) return mockAuthorRepository;
      if (entity === Category) return mockCategoryRepository;
    });

    quoteResolver = new QuoteResolver();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('quoteById', () => {
    it('should return a quote by id with relations', async () => {
      const mockQuote = {
        id: 1,
        quote: 'Test quote',
        permalink: 'test-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOne.mockResolvedValue(mockQuote);

      const result = await quoteResolver.quoteById(1);

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['author', 'categories']
      });
    });

    it('should return null if quote not found', async () => {
      mockQuoteRepository.findOne.mockResolvedValue(null);

      const result = await quoteResolver.quoteById(999);

      expect(result).toBeNull();
      expect(mockQuoteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['author', 'categories']
      });
    });
  });

  describe('quote', () => {
    it('should return a quote by permalink with relations', async () => {
      const mockQuote = {
        id: 1,
        quote: 'Test quote',
        permalink: 'test-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOne.mockResolvedValue(mockQuote);

      const result = await quoteResolver.quote('test-quote');

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.findOne).toHaveBeenCalledWith({
        where: { permalink: 'test-quote' },
        relations: ['author', 'categories']
      });
    });

    it('should return null if quote with permalink not found', async () => {
      mockQuoteRepository.findOne.mockResolvedValue(null);

      const result = await quoteResolver.quote('non-existent');

      expect(result).toBeNull();
      expect(mockQuoteRepository.findOne).toHaveBeenCalledWith({
        where: { permalink: 'non-existent' },
        relations: ['author', 'categories']
      });
    });
  });

  describe('quotes (paginated)', () => {
    let mockQueryBuilder: any;

    beforeEach(() => {
      mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    describe('limit validation', () => {
      it('should throw error when limit exceeds 20', async () => {
        await expect(
          quoteResolver.quotes(1, 21)
        ).rejects.toThrow('Limit cannot exceed 20');
      });

      it('should accept limit of 20', async () => {
        const mockQuotes = new Array(20).fill(null).map((_, i) => ({
          id: i + 1,
          quote: `Quote ${i + 1}`,
          permalink: `quote-${i + 1}`,
          authorId: 1
        }));

        mockQueryBuilder.getCount.mockResolvedValue(100);
        mockQueryBuilder.getMany.mockResolvedValue(mockQuotes);

        const result = await quoteResolver.quotes(1, 20);

        expect(result.limit).toBe(20);
        expect(result.items.length).toBe(20);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      });

      it('should use default limit of 10', async () => {
        const mockQuotes = new Array(10).fill(null).map((_, i) => ({
          id: i + 1,
          quote: `Quote ${i + 1}`,
          permalink: `quote-${i + 1}`,
          authorId: 1
        }));

        mockQueryBuilder.getCount.mockResolvedValue(50);
        mockQueryBuilder.getMany.mockResolvedValue(mockQuotes);

        const result = await quoteResolver.quotes();

        expect(result.limit).toBe(10);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      });
    });

    describe('pagination', () => {
      it('should return correct page of results', async () => {
        const mockQuotes = new Array(10).fill(null).map((_, i) => ({
          id: i + 11,
          quote: `Quote ${i + 11}`,
          permalink: `quote-${i + 11}`,
          authorId: 1
        }));

        mockQueryBuilder.getCount.mockResolvedValue(50);
        mockQueryBuilder.getMany.mockResolvedValue(mockQuotes);

        const result = await quoteResolver.quotes(2, 10);

        expect(result.page).toBe(2);
        expect(result.total).toBe(50);
        expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10);
        expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      });

      it('should calculate hasMore correctly when more pages exist', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(50);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await quoteResolver.quotes(1, 10);

        expect(result.hasMore).toBe(true);
        expect(result.totalPages).toBe(5);
      });

      it('should calculate hasMore correctly when on last page', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(50);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await quoteResolver.quotes(5, 10);

        expect(result.hasMore).toBe(false);
        expect(result.totalPages).toBe(5);
      });

      it('should handle page beyond available data', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(25);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await quoteResolver.quotes(10, 10);

        expect(result.items).toEqual([]);
        expect(result.hasMore).toBe(false);
        expect(result.totalPages).toBe(3);
      });
    });

    describe('wildcard filters', () => {
      it('should filter by author with partial match', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(5);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, 'Einstein');

        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('quote.author', 'author_filter');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('author_filter.name LIKE :author', { author: '%Einstein%' });
      });

      it('should filter by category with partial match', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(5);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, 'love');

        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.categories', 'categories');
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('quote.categories', 'category_filter');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category_filter.name LIKE :category', { category: '%love%' });
      });

      it('should combine author and category filters with AND logic', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(2);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, 'Shakespeare', 'love');

        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('quote.author', 'author_filter');
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('quote.categories', 'category_filter');
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('author_filter.name LIKE :author', { author: '%Shakespeare%' });
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('category_filter.name LIKE :category', { category: '%love%' });
      });

      it('should use LIKE for case-insensitive partial matching', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(5);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, 'einstein');

        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('author_filter.name LIKE :author', { author: '%einstein%' });
      });
    });

    describe('sorting', () => {
      it('should sort by ID ascending by default', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes();

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.id', 'ASC');
      });

      it('should sort by ID descending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.ID, SortDirection.DESC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.id', 'DESC');
      });

      it('should sort by quote text ascending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.QUOTE, SortDirection.ASC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.quote', 'ASC');
      });

      it('should sort by quote text descending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.QUOTE, SortDirection.DESC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.quote', 'DESC');
      });

      it('should sort by author ascending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.AUTHOR, SortDirection.ASC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('author.name', 'ASC');
      });

      it('should sort by author descending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.AUTHOR, SortDirection.DESC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('author.name', 'DESC');
      });

      it('should sort by permalink ascending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.PERMALINK, SortDirection.ASC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.permalink', 'ASC');
      });

      it('should sort by permalink descending', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(10);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, undefined, undefined, QuoteSortField.PERMALINK, SortDirection.DESC);

        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.permalink', 'DESC');
      });
    });

    describe('edge cases', () => {
      it('should handle empty results', async () => {
        mockQueryBuilder.getCount.mockResolvedValue(0);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        const result = await quoteResolver.quotes();

        expect(result.items).toEqual([]);
        expect(result.total).toBe(0);
        expect(result.hasMore).toBe(false);
        expect(result.totalPages).toBe(0);
      });

      it('should handle single result', async () => {
        const mockQuote = {
          id: 1,
          quote: 'Single quote',
          permalink: 'single-quote',
          authorId: 1
        } as Quote;

        mockQueryBuilder.getCount.mockResolvedValue(1);
        mockQueryBuilder.getMany.mockResolvedValue([mockQuote]);

        const result = await quoteResolver.quotes();

        expect(result.items).toEqual([mockQuote]);
        expect(result.total).toBe(1);
        expect(result.hasMore).toBe(false);
        expect(result.totalPages).toBe(1);
      });

      it('should handle exact limit boundary', async () => {
        const mockQuotes = new Array(10).fill(null).map((_, i) => ({
          id: i + 11,
          quote: `Quote ${i + 11}`,
          permalink: `quote-${i + 11}`,
          authorId: 1
        }));

        mockQueryBuilder.getCount.mockResolvedValue(20);
        mockQueryBuilder.getMany.mockResolvedValue(mockQuotes);

        const result = await quoteResolver.quotes(2, 10);

        expect(result.page).toBe(2);
        expect(result.hasMore).toBe(false);
        expect(result.totalPages).toBe(2);
      });

      it('should use different aliases for eager-load and filter joins', async () => {
        const { QuoteSortField, SortDirection } = require('../../types');
        mockQueryBuilder.getCount.mockResolvedValue(5);
        mockQueryBuilder.getMany.mockResolvedValue([]);

        await quoteResolver.quotes(1, 10, 'Einstein', undefined, QuoteSortField.AUTHOR, SortDirection.ASC);

        // Check that eager-load uses 'author'
        expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
        // Check that filter join uses 'author_filter'
        expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith('quote.author', 'author_filter');
        // Check that sorting uses the eager-loaded 'author' alias
        expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('author.name', 'ASC');
      });
    });
  });

  describe('randomQuote', () => {
    it('should return a random quote with relations', async () => {
      const mockQuote = {
        id: 5,
        quote: 'Random quote',
        permalink: 'random-quote',
        authorId: 3,
      } as Quote;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockQuote),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.randomQuote();

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.createQueryBuilder).toHaveBeenCalledWith('quote');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.categories', 'categories');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('RAND()');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return null if no quotes exist', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.randomQuote();

      expect(result).toBeNull();
    });
  });

  describe('quoteByPermalink', () => {
    it('should return a quote by author and permalink with relations', async () => {
      const mockAuthor = {
        id: 1,
        name: 'Test Author',
        permalink: 'test-author',
      } as Author;

      const mockQuote = {
        id: 1,
        quote: 'Test quote',
        permalink: 'test-quote',
        authorId: 1,
      } as Quote;

      mockAuthorRepository.findOne.mockResolvedValue(mockAuthor);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockQuote),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.quoteByPermalink('test-author', 'test-quote');

      expect(result).toEqual(mockQuote);
      expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
        where: { permalink: 'test-author' },
      });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.categories', 'categories');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('quote.permalink = :permalink', { permalink: 'test-quote' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('quote.authorId = :authorId', { authorId: 1 });
    });

    it('should return null if author not found', async () => {
      mockAuthorRepository.findOne.mockResolvedValue(null);

      const result = await quoteResolver.quoteByPermalink('non-existent-author', 'test-quote');

      expect(result).toBeNull();
      expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
        where: { permalink: 'non-existent-author' },
      });
    });

    it('should return null if quote not found for given author and permalink', async () => {
      const mockAuthor = {
        id: 1,
        name: 'Test Author',
        permalink: 'test-author',
      } as Author;

      mockAuthorRepository.findOne.mockResolvedValue(mockAuthor);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.quoteByPermalink('test-author', 'non-existent-quote');

      expect(result).toBeNull();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('quote.permalink = :permalink', { permalink: 'non-existent-quote' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('quote.authorId = :authorId', { authorId: 1 });
    });
  });

  describe('nextQuote', () => {
    it('should return the next quote with relations', async () => {
      const currentQuote = {
        id: 5,
        quote: 'Current quote',
        permalink: 'current-quote',
        authorId: 1,
      } as Quote;

      const nextQuote = {
        id: 6,
        quote: 'Next quote',
        permalink: 'next-quote',
        authorId: 2,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(currentQuote);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(nextQuote),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.nextQuote(5);

      expect(result).toEqual(nextQuote);
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.categories', 'categories');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('quote.id > :id', { id: 5 });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.id', 'ASC');
    });

    it('should wrap around to first quote when at the end', async () => {
      const lastQuote = {
        id: 10,
        quote: 'Last quote',
        permalink: 'last-quote',
        authorId: 1,
      } as Quote;

      const firstQuote = {
        id: 1,
        quote: 'First quote',
        permalink: 'first-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(lastQuote);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn()
          .mockResolvedValueOnce(null)  // No next quote found
          .mockResolvedValueOnce(firstQuote),  // First quote returned
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.nextQuote(10);

      expect(result).toEqual(firstQuote);
      expect(mockQueryBuilder.getOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid ID', async () => {
      mockQuoteRepository.findOneBy.mockResolvedValue(null);

      await expect(quoteResolver.nextQuote(999)).rejects.toThrow('Quote with ID 999 not found');
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('prevQuote', () => {
    it('should return the previous quote with relations', async () => {
      const currentQuote = {
        id: 5,
        quote: 'Current quote',
        permalink: 'current-quote',
        authorId: 1,
      } as Quote;

      const prevQuote = {
        id: 4,
        quote: 'Previous quote',
        permalink: 'prev-quote',
        authorId: 2,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(currentQuote);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(prevQuote),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.prevQuote(5);

      expect(result).toEqual(prevQuote);
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.author', 'author');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('quote.categories', 'categories');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('quote.id < :id', { id: 5 });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('quote.id', 'DESC');
    });

    it('should wrap around to last quote when at the beginning', async () => {
      const firstQuote = {
        id: 1,
        quote: 'First quote',
        permalink: 'first-quote',
        authorId: 1,
      } as Quote;

      const lastQuote = {
        id: 10,
        quote: 'Last quote',
        permalink: 'last-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(firstQuote);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn()
          .mockResolvedValueOnce(null)  // No previous quote found
          .mockResolvedValueOnce(lastQuote),  // Last quote returned
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.prevQuote(1);

      expect(result).toEqual(lastQuote);
      expect(mockQueryBuilder.getOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid ID', async () => {
      mockQuoteRepository.findOneBy.mockResolvedValue(null);

      await expect(quoteResolver.prevQuote(999)).rejects.toThrow('Quote with ID 999 not found');
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });
});
