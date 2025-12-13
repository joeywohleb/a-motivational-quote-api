import { Arg, Int, Query, Resolver } from "type-graphql";
import { type Repository } from "typeorm";

import { dataSource } from '../datasource';
import { Author, Category, Quote } from "../entities";
import { QuotePage, QuoteSortField, SortDirection } from "../types";

@Resolver(_of => Quote)
export class QuoteResolver {
  private readonly authorRepository: Repository<Author>;
  private readonly categoryRepository: Repository<Category>;
  private readonly quoteRepository: Repository<Quote>;

  constructor() {
    this.authorRepository = dataSource.getRepository(Author);
    this.categoryRepository = dataSource.getRepository(Category);
    this.quoteRepository = dataSource.getRepository(Quote);
  }

  @Query(_returns => Quote, { nullable: true })
  quoteById(@Arg("quoteId", _type => Int) quoteId: number) {
    return this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['author', 'categories']
    });
  }

  @Query(_returns => Quote, { nullable: true })
  quote(@Arg("permalink") permalink: string) {
    return this.quoteRepository.findOne({
      where: { permalink },
      relations: ['author', 'categories']
    });
  }


  @Query(_returns => QuotePage, {
    complexity: ({ args, childComplexity }) => {
      const limit = args.limit || 10;
      return 10 + limit * childComplexity;
    }
  })
  async quotes(
    @Arg("page", _type => Int, { nullable: true, defaultValue: 1 }) page: number = 1,
    @Arg("limit", _type => Int, { nullable: true, defaultValue: 10 }) limit: number = 10,
    @Arg("author", { nullable: true }) author?: string,
    @Arg("category", { nullable: true }) category?: string,
    @Arg("sortBy", _type => QuoteSortField, { nullable: true, defaultValue: QuoteSortField.ID }) sortBy: QuoteSortField = QuoteSortField.ID,
    @Arg("sortDirection", _type => SortDirection, { nullable: true, defaultValue: SortDirection.ASC }) sortDirection: SortDirection = SortDirection.ASC
  ): Promise<QuotePage> {
    // 1. Validate limit
    if (limit > 20) {
      throw new Error("Limit cannot exceed 20");
    }

    // 2. Build query with eager-loaded relations
    const queryBuilder = this.quoteRepository.createQueryBuilder('quote')
      .leftJoinAndSelect('quote.author', 'author')
      .leftJoinAndSelect('quote.categories', 'categories');

    // 3. Apply filters
    if (author) {
      queryBuilder
        .leftJoin('quote.author', 'author_filter')
        .andWhere('author_filter.name LIKE :author', { author: `%${author}%` });
    }

    if (category) {
      queryBuilder
        .leftJoin('quote.categories', 'category_filter')
        .andWhere('category_filter.name LIKE :category', { category: `%${category}%` });
    }

    // 4. Apply sorting
    switch (sortBy) {
      case QuoteSortField.ID:
        queryBuilder.orderBy('quote.id', sortDirection);
        break;
      case QuoteSortField.QUOTE:
        queryBuilder.orderBy('quote.quote', sortDirection);
        break;
      case QuoteSortField.AUTHOR:
        // Use the already-joined 'author' alias from eager-loading
        queryBuilder.orderBy('author.name', sortDirection);
        break;
      case QuoteSortField.PERMALINK:
        queryBuilder.orderBy('quote.permalink', sortDirection);
        break;
    }

    // 5. Get total count (before pagination)
    const total = await queryBuilder.getCount();

    // 6. Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // 7. Execute query
    const items = await queryBuilder.getMany();

    // 8. Build response
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      items,
      total,
      page,
      limit,
      hasMore,
      totalPages
    };
  }

  @Query(_returns => Quote, { nullable: true })
  async randomQuote(): Promise<Quote | null> {
    // Get a random quote using ORDER BY RAND() LIMIT 1
    const result = await this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.author', 'author')
      .leftJoinAndSelect('quote.categories', 'categories')
      .orderBy('RAND()')
      .limit(1)
      .getOne();

    return result;
  }

  @Query(_returns => Quote, { nullable: true })
  async quoteByPermalink(
    @Arg("author") author: string,
    @Arg("permalink") permalink: string
  ): Promise<Quote | null> {
    // Find the author by permalink
    const authorEntity = await this.authorRepository.findOne({
      where: { permalink: author }
    });

    if (!authorEntity) {
      return null;
    }

    // Find the quote by permalink and author ID using query builder
    const quote = await this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.author', 'author')
      .leftJoinAndSelect('quote.categories', 'categories')
      .where('quote.permalink = :permalink', { permalink })
      .andWhere('quote.authorId = :authorId', { authorId: authorEntity.id })
      .getOne();

    return quote;
  }

  @Query(_returns => Quote, { nullable: true })
  async nextQuote(@Arg("id", _type => Int) id: number): Promise<Quote | null> {
    // First check if the quote with the given ID exists
    const currentQuote = await this.quoteRepository.findOneBy({ id });

    if (!currentQuote) {
      throw new Error(`Quote with ID ${id} not found`);
    }

    // Try to find the next quote (with ID greater than current)
    const nextQuote = await this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.author', 'author')
      .leftJoinAndSelect('quote.categories', 'categories')
      .where('quote.id > :id', { id })
      .orderBy('quote.id', 'ASC')
      .limit(1)
      .getOne();

    // If no next quote found, wrap around to the first quote
    if (!nextQuote) {
      return await this.quoteRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.author', 'author')
        .leftJoinAndSelect('quote.categories', 'categories')
        .orderBy('quote.id', 'ASC')
        .limit(1)
        .getOne();
    }

    return nextQuote;
  }

  @Query(_returns => Quote, { nullable: true })
  async prevQuote(@Arg("id", _type => Int) id: number): Promise<Quote | null> {
    // First check if the quote with the given ID exists
    const currentQuote = await this.quoteRepository.findOneBy({ id });

    if (!currentQuote) {
      throw new Error(`Quote with ID ${id} not found`);
    }

    // Try to find the previous quote (with ID less than current)
    const prevQuote = await this.quoteRepository
      .createQueryBuilder('quote')
      .leftJoinAndSelect('quote.author', 'author')
      .leftJoinAndSelect('quote.categories', 'categories')
      .where('quote.id < :id', { id })
      .orderBy('quote.id', 'DESC')
      .limit(1)
      .getOne();

    // If no previous quote found, wrap around to the last quote
    if (!prevQuote) {
      return await this.quoteRepository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.author', 'author')
        .leftJoinAndSelect('quote.categories', 'categories')
        .orderBy('quote.id', 'DESC')
        .limit(1)
        .getOne();
    }

    return prevQuote;
  }
}