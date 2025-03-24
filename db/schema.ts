import { relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  foreignKey,
} from "drizzle-orm/sqlite-core";

// Category Table with self-referential parent
// @ts-ignore
// Remove the foreignKey block and keep only the column reference
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  // @ts-ignore
  parentId: integer("parent_id").references(() => categories.id),
});
// Priority Table
export const priorities = sqliteTable("priorities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: text("value", { enum: ["very-high", "high", "medium", "low"] })
    .notNull()
    .unique(),
});

// Status Table
export const statuses = sqliteTable("statuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: text("value", { enum: ["done", "in-progress", "new"] })
    .notNull()
    .unique(),
});

// Category Table with self-referential parent
// @ts-ignore
// export const categories = sqliteTable('categories', {
//   id: integer('id').primaryKey({ autoIncrement: true }),
//   title: text('title').notNull(),
//     // @ts-ignore
//   parentId: integer('parent_id').references(() => categories.id),
// });

// Main Truant Table

// Correct schema with proper foreign keys
export const truants = sqliteTable("truants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  priorityId: integer("priority_id")
    .notNull()
    .references(() => priorities.id),
  link: text("link"),
  statusId: integer("status_id")
    .notNull()
    .references(() => statuses.id),
});

// Proper relations configuration
export const truantRelations = relations(truants, ({ one }) => ({
  category: one(categories, {
    fields: [truants.categoryId],
    references: [categories.id]
  }),
  priority: one(priorities, {
    fields: [truants.priorityId],
    references: [priorities.id]
  }),
  status: one(statuses, {
    fields: [truants.statusId],
    references: [statuses.id]
  }),
}));

// Type exports
export type Truant = typeof truants.$inferSelect & {
  category: Category;
  priority: Priority;
  status: Status;
};
export type Category = typeof categories.$inferSelect;
export type Priority = typeof priorities.$inferSelect;
export type Status = typeof statuses.$inferSelect;
export type TruantWithRelations = typeof truants.$inferSelect & {
  category?: Category;
  priority?: Priority;
  status?: Status;
};