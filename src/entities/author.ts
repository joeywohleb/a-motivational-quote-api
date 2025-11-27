import { Field, ID, ObjectType } from "type-graphql";
import { Column, Entity, PrimaryGeneratedColumn, RelationId } from "typeorm";


@Entity()
@ObjectType()
export class Author {
  @Field(_type => ID)
  @PrimaryGeneratedColumn()
  readonly id!: number;

  @Field()
  @Column('text')
  name: string;

  @Field()
  @Column()
  permalink!: string;
}