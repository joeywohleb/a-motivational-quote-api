import { Field, ID, ObjectType } from "type-graphql";
import { Column, Entity, PrimaryGeneratedColumn, RelationId } from "typeorm";


@Entity()
@ObjectType()
export class Category {
  @Field(_type => ID)
  @PrimaryGeneratedColumn()
  readonly id!: number;

  @Field()
  @Column()
  name: string
}
