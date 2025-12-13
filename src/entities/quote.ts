import { Field, ID, ObjectType } from "type-graphql";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";

import { Author } from "./author";
import { Category } from "./category";

@Entity()
@ObjectType()
export class Quote {
  @Field(_type => ID)
  @PrimaryGeneratedColumn()
  readonly id!: number;

  @Field()
  @Column('text')
  quote!: string;

  @Field()
  @Column()
  permalink!: string;

  @Field(_type => Author)
  @ManyToOne(_type => Author)
  author?: Author;

  @RelationId((quote: Quote) => quote.author)
  authorId?: number;

  @Field(_type => [Category])
  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[]
}