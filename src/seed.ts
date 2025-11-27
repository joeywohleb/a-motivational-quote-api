import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { dataSource } from './datasource.js';
import { Author, Category, Quote } from './entities/index.js';
import { permalinkGenerator, cleanQuote, normalizeCategory, normalizeAuthorName, getAuthorKey } from './utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface QuoteRecord {
  quote: string;
  author: string;
  category: string;
}

async function parseCSVFile(filePath: string): Promise<QuoteRecord[]> {
  return new Promise((resolve) => {
    const records: QuoteRecord[] = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: true,
    });

    createReadStream(filePath)
      .pipe(parser)
      .on('data', (record: QuoteRecord) => {
        records.push(record);
      })
      .on('error', (error) => {
        console.warn('CSV parsing error:', error.message);
      })
      .on('end', () => {
        resolve(records);
      });
  });
}

async function seedDatabase() {
  console.log('Initializing database connection...');
  await dataSource.initialize();

  const authorRepository = dataSource.getRepository(Author);
  const categoryRepository = dataSource.getRepository(Category);
  const quoteRepository = dataSource.getRepository(Quote);

  // Maps to cache entities and avoid duplicates
  const authorsMap = new Map<string, Author>();
  const categoriesMap = new Map<string, Category>();

  // Get seed limit from environment variable (default: unlimited)
  const seedLimit = process.env.SEED_LIMIT ? parseInt(process.env.SEED_LIMIT, 10) : undefined;
  let totalProcessed = 0;

  console.log('Starting to process CSV files...');
  if (seedLimit) {
    console.log(`Seed limit set to: ${seedLimit} quotes`);
  }

  // Process all 5 CSV files
  for (let i = 1; i <= 5; i++) {
    // Check if we've reached the limit
    if (seedLimit && totalProcessed >= seedLimit) {
      console.log(`\nReached seed limit of ${seedLimit} quotes. Stopping.`);
      break;
    }
    const filePath = join(__dirname, `quotes.${i}of5.csv`);
    console.log(`\nProcessing ${filePath}...`);

    try {
      const records = await parseCSVFile(filePath);
      console.log(`Found ${records.length} quotes in file ${i} of 5`);

      let processedCount = 0;
      let skippedCount = 0;

      for (const record of records) {
        // Check if we've reached the limit
        if (seedLimit && totalProcessed >= seedLimit) {
          break;
        }

        // Validate record has required fields
        if (!record.quote || !record.author || !record.category) {
          skippedCount++;
          continue;
        }

        // Skip if quote or author seems malformed (too long to be an author name)
        if (record.author.length > 500 || record.quote.length < 10) {
          console.warn(`Skipping malformed record: author="${record.author.substring(0, 50)}..."`);
          skippedCount++;
          continue;
        }

        try {
          // Clean and normalize the data
          const cleanedQuote = cleanQuote(record.quote);
          const normalizedAuthor = normalizeAuthorName(record.author);
          const authorKey = getAuthorKey(record.author);

          // Process Author using normalized key to group similar names
          let author = authorsMap.get(authorKey);
          if (!author) {
            author = authorRepository.create({
              name: normalizedAuthor,
              permalink: permalinkGenerator(normalizedAuthor, 3),
            });
            author = await authorRepository.save(author);
            authorsMap.set(authorKey, author);
          }

          // Process Categories with normalization
          const categoryNames = record.category
            .split(',')
            .map((cat) => normalizeCategory(cat))
            .filter(Boolean);

          const quoteCategories: Category[] = [];
          for (const categoryName of categoryNames) {
            let category = categoriesMap.get(categoryName);
            if (!category) {
              category = categoryRepository.create({
                name: categoryName,
              });
              category = await categoryRepository.save(category);
              categoriesMap.set(categoryName, category);
            }
            quoteCategories.push(category);
          }

          // Create Quote with cleaned text
          const quote = quoteRepository.create({
            quote: cleanedQuote,
            permalink: permalinkGenerator(cleanedQuote, 5),
            author: author,
            categories: quoteCategories,
          });
          await quoteRepository.save(quote);
          processedCount++;
          totalProcessed++;
        } catch (error) {
          console.warn(`Error saving record, skipping:`, error.message);
          skippedCount++;
        }
      }

      console.log(`✓ Completed processing file ${i} of 5 (processed: ${processedCount}, skipped: ${skippedCount})`);
    } catch (error) {
      console.error(`Error processing file ${i}:`, error);
      throw error;
    }
  }

  console.log('\n=== Seeding Summary ===');
  console.log(`Total Authors: ${authorsMap.size}`);
  console.log(`Total Categories: ${categoriesMap.size}`);
  console.log(`Total Quotes: ${await quoteRepository.count()}`);
  if (seedLimit) {
    console.log(`Seed limit was: ${seedLimit} quotes`);
  }
  console.log('Database seeding completed successfully!');

  await dataSource.destroy();
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\nSeed script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
