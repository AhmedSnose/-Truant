import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  parentId: integer("parent_id").references(() => categories.id),
});

// Type export for Category
export type Category = typeof categories.$inferSelect;