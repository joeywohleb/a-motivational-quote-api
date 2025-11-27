#!/bin/bash
set -e

echo "Installing/updating dependencies..."
npm install

echo "Waiting for database to be ready..."
# Wait for MySQL to be ready using a simple node script
until node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    await connection.end();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
" 2>/dev/null
do
  echo "Waiting for database connection..."
  sleep 2
done

echo "Database is ready!"

# Check if database needs seeding (only seed if quote table is empty or doesn't exist)
echo "Checking if database needs seeding..."
QUOTE_COUNT=$(node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM quote');
    await connection.end();
    console.log(rows[0].count);
    process.exit(0);
  } catch (err) {
    // Table doesn't exist or other error, return 0
    console.log(0);
    process.exit(0);
  }
})();
" 2>/dev/null)

if [ "$QUOTE_COUNT" -eq 0 ]; then
  echo "Database is empty. Running seed script..."
  npm run seed
else
  echo "Database already has $QUOTE_COUNT quotes. Skipping seed."
fi

echo "Starting development server..."
exec npm run start:dev
