import { ApolloServer, gql } from 'apollo-server';

// Define the GraphQL schema
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

// Define resolvers
const resolvers = {
  Query: {
    hello: () => 'Hello World!',
  },
};

// Create an Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
const port = 4000;
server.listen({ port }).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});