import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  // schema: './db/schema.ts',
  schema: './db/schema.test.ts',
  // schema: "./db/**/*.sql.ts", // Dax's favourite
  out: './drizzle',
  // experimental: {
  //   seeding: true
  // },
  // migrations: {
  //   table: '__drizzle_migrations', // Default migrations table
  //   schema: 'public', // Default schema for PostgreSQL; adjust if using a different database
  // },
});

// import type { Config } from 'drizzle-kit';

// export default {
// 	schema: './db/schema.ts',
// 	out: './drizzle',
//   dialect: 'sqlite',
// 	driver: 'expo', // <--- very important
// } satisfies Config;
