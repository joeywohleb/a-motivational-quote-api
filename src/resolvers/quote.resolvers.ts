import { Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, Root } from "type-graphql";
import { type Repository } from "typeorm";

import { dataSource } from '../datasource';
import { Author, Category, Quote } from "../entities";

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
    return this.quoteRepository.findOneBy({ id: quoteId });
  }

  @Query(_returns => Quote, { nullable: true })
  quote(@Arg("permalink") permalink: string) {
    return this.quoteRepository.findOneBy({ permalink });
  }


  @Query(_returns => [Quote])
  quotes(): Promise<Quote[]> {
    return this.quoteRepository.find();
  }

  @Query(_returns => Quote, { nullable: true })
  async randomQuote(): Promise<Quote | null> {
    // Get a random quote using ORDER BY RAND() LIMIT 1
    const result = await this.quoteRepository
      .createQueryBuilder('quote')
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
      .where('quote.id > :id', { id })
      .orderBy('quote.id', 'ASC')
      .limit(1)
      .getOne();

    // If no next quote found, wrap around to the first quote
    if (!nextQuote) {
      return await this.quoteRepository
        .createQueryBuilder('quote')
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
      .where('quote.id < :id', { id })
      .orderBy('quote.id', 'DESC')
      .limit(1)
      .getOne();

    // If no previous quote found, wrap around to the last quote
    if (!prevQuote) {
      return await this.quoteRepository
        .createQueryBuilder('quote')
        .orderBy('quote.id', 'DESC')
        .limit(1)
        .getOne();
    }

    return prevQuote;
  }

  @FieldResolver()
  async author(@Root() quote: Quote): Promise<Author> {
    return (await this.authorRepository.findOne({ where: { id: quote.authorId }, cache: 1000 }))!;
  }
}