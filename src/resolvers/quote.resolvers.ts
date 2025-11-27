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

  @FieldResolver()
  async author(@Root() quote: Quote): Promise<Author> {
    return (await this.authorRepository.findOne({ where: { id: quote.authorId }, cache: 1000 }))!;
  }
}