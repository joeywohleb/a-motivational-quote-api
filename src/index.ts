import { ApolloServer } from 'apollo-server';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse';
import { buildSchema } from 'type-graphql';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { QuoteResolver } from './resolvers';
import { permalinkGenerator } from './utils/permalinkGenerator.util';
import { dataSource } from './datasource';
import { Author, Category, Quote } from './entities';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function loadQuotesFromCSV() {
  return new Promise<any[]>((resolve, reject) => {
    const results: any[] = [];
    const csvPath = path.resolve(__dirname, 'quotes.csv');
    
    console.log(`Loading quotes from ${csvPath}...`);
    
    fs.createReadStream(csvPath)
      .pipe(parse())
      .on('data', (data) => results.push(data))
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      })
      .on('end', () => {
        console.log(`Loaded ${results.length} quotes from CSV`);
        resolve(results);
      });
  });
}

async function seedDatabase() {
  try {
    const results = await loadQuotesFromCSV();
    
    const authorRepository = dataSource.getRepository(Author);
    const categoryRepository = dataSource.getRepository(Category);
    const quoteRepository = dataSource.getRepository(Quote);

    // Create a map to track existing authors and categories
    const authorMap = new Map<string, Author>();
    const categoryMap = new Map<string, Category>();

    console.log('Seeding database...');
    
    for (const row of results) {
      const [quoteText, authorName, categoriesStr] = row;
      
      if (!quoteText || !authorName) continue;

      // Get or create author
      let author = authorMap.get(authorName);
      if (!author) {
        const existingAuthor = await authorRepository.findOne({ where: { permalink: permalinkGenerator(authorName, 10) } });
        if (existingAuthor) {
          author = existingAuthor;
        } else {
          author = authorRepository.create({
            name: authorName,
            permalink: permalinkGenerator(authorName, 10)
          });
          author = await authorRepository.save(author);
        }
        authorMap.set(authorName, author);
      }

      // Get or create categories
      const categoryNames = categoriesStr ? categoriesStr.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [];
      const quoteCategories: Category[] = [];
      
      for (const categoryName of categoryNames) {
        let category = categoryMap.get(categoryName);
        if (!category) {
          const existingCategory = await categoryRepository.findOne({ where: { name: categoryName } });
          if (existingCategory) {
            category = existingCategory;
          } else {
            category = categoryRepository.create({ name: categoryName });
            category = await categoryRepository.save(category);
          }
          categoryMap.set(categoryName, category);
        }
        quoteCategories.push(category);
      }

      // Create quote
      const quote = quoteRepository.create({
        quote: quoteText,
        permalink: permalinkGenerator(quoteText),
        author: author,
        categories: quoteCategories
      });
      
      await quoteRepository.save(quote);
    }

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [QuoteResolver],
      emitSchemaFile: path.resolve(__dirname, 'schema.gql'),
    });

    // Seed database (only if needed - you might want to add a check here)
    // await seedDatabase();

    // Create an Apollo Server instance
    const server = new ApolloServer({ schema });

    // Start the server
    const port = 4000;
    const { url } = await server.listen({ port });
    console.log(`Server ready at ${url}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();