import { registerEnumType } from "type-graphql";

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC"
}

registerEnumType(SortDirection, {
  name: "SortDirection",
  description: "Sort direction"
});
