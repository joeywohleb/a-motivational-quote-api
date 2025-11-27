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
    it('should return a quote by id', async () => {
      const mockQuote = {
        id: 1,
        quote: 'Test quote',
        permalink: 'test-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(mockQuote);

      const result = await quoteResolver.quoteById(1);

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null if quote not found', async () => {
      mockQuoteRepository.findOneBy.mockResolvedValue(null);

      const result = await quoteResolver.quoteById(999);

      expect(result).toBeNull();
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ id: 999 });
    });
  });

  describe('quote', () => {
    it('should return a quote by permalink', async () => {
      const mockQuote = {
        id: 1,
        quote: 'Test quote',
        permalink: 'test-quote',
        authorId: 1,
      } as Quote;

      mockQuoteRepository.findOneBy.mockResolvedValue(mockQuote);

      const result = await quoteResolver.quote('test-quote');

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ permalink: 'test-quote' });
    });

    it('should return null if quote with permalink not found', async () => {
      mockQuoteRepository.findOneBy.mockResolvedValue(null);

      const result = await quoteResolver.quote('non-existent');

      expect(result).toBeNull();
      expect(mockQuoteRepository.findOneBy).toHaveBeenCalledWith({ permalink: 'non-existent' });
    });
  });

  describe('quotes', () => {
    it('should return all quotes', async () => {
      const mockQuotes = [
        { id: 1, quote: 'Quote 1', permalink: 'quote-1', authorId: 1 },
        { id: 2, quote: 'Quote 2', permalink: 'quote-2', authorId: 2 },
      ] as Quote[];

      mockQuoteRepository.find.mockResolvedValue(mockQuotes);

      const result = await quoteResolver.quotes();

      expect(result).toEqual(mockQuotes);
      expect(mockQuoteRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if no quotes exist', async () => {
      mockQuoteRepository.find.mockResolvedValue([]);

      const result = await quoteResolver.quotes();

      expect(result).toEqual([]);
      expect(mockQuoteRepository.find).toHaveBeenCalled();
    });
  });

  describe('randomQuote', () => {
    it('should return a random quote', async () => {
      const mockQuote = {
        id: 5,
        quote: 'Random quote',
        permalink: 'random-quote',
        authorId: 3,
      } as Quote;

      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockQuote),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.randomQuote();

      expect(result).toEqual(mockQuote);
      expect(mockQuoteRepository.createQueryBuilder).toHaveBeenCalledWith('quote');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('RAND()');
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should return null if no quotes exist', async () => {
      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockQuoteRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await quoteResolver.randomQuote();

      expect(result).toBeNull();
    });
  });

  describe('author (field resolver)', () => {
    it('should return the author for a quote', async () => {
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

      const result = await quoteResolver.author(mockQuote);

      expect(result).toEqual(mockAuthor);
      expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        cache: 1000,
      });
    });

    it('should cache author lookups', async () => {
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

      await quoteResolver.author(mockQuote);

      expect(mockAuthorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        cache: 1000,
      });
    });
  });
});
