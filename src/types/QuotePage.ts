import { Field, Int, ObjectType } from "type-graphql";
import { Quote } from "../entities/quote";

@ObjectType()
export class QuotePage {
  @Field(() => [Quote])
  items: Quote[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasMore: boolean;

  @Field(() => Int)
  totalPages: number;
}
