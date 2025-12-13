import { registerEnumType } from "type-graphql";

export enum QuoteSortField {
  ID = "ID",
  QUOTE = "QUOTE",
  AUTHOR = "AUTHOR",
  PERMALINK = "PERMALINK"
}

registerEnumType(QuoteSortField, {
  name: "QuoteSortField",
  description: "Fields available for sorting quotes"
});
