import { relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

// Category Table with self-referential parent
// @ts-ignore
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

// Main Truant Table
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

// Sprint Table
export const sprints = sqliteTable("sprints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalTime: integer("total_time").notNull().default(0),
  goalTime: integer("goal_time").notNull().default(0),
  description: text("description"),
  statusId: integer("status_id")
    .notNull()
    .references(() => statuses.id),
});

// Day Table
export const days = sqliteTable("days", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sprintId: integer("sprint_id")
    .notNull()
    .references(() => sprints.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  totalTime: integer("total_time").notNull().default(0),
  goalTime: integer("goal_time").notNull().default(0),
  report: text("report"),
  statusId: integer("status_id")
    .notNull()
    .references(() => statuses.id),
});

// Event Table
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dayId: integer("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  startTime: integer("start_time").notNull().default(0),
  endTime: integer("end_time").notNull().default(0),
  weight: integer("weight").notNull(),
  description: text("description"),
  report: text("report"),
  statusId: integer("status_id")
    .notNull()
    .references(() => statuses.id),
  truantId: integer("truant_id")
    .references(() => truants.id),
});

// Relations
export const sprintRelations = relations(sprints, ({ many, one }) => ({
  days: many(days),
  status: one(statuses, {
    fields: [sprints.statusId],
    references: [statuses.id],
  }),
}));

export const dayRelations = relations(days, ({ one, many }) => ({
  sprint: one(sprints, {
    fields: [days.sprintId],
    references: [sprints.id],
  }),
  status: one(statuses, {
    fields: [days.statusId],
    references: [statuses.id],
  }),
  events: many(events), // ✅ One-to-many relationship between days and events
}));

export const eventRelations = relations(events, ({ one }) => ({
  day: one(days, {
    fields: [events.dayId],
    references: [days.id],
  }),
  status: one(statuses, {
    fields: [events.statusId],
    references: [statuses.id],
  }),
  truant: one(truants, {
    fields: [events.truantId],
    references: [truants.id],
  }),
}));

export const truantRelations = relations(truants, ({ one }) => ({
  category: one(categories, {
    fields: [truants.categoryId],
    references: [categories.id],
  }),
  priority: one(priorities, {
    fields: [truants.priorityId],
    references: [priorities.id],
  }),
  status: one(statuses, {
    fields: [truants.statusId],
    references: [statuses.id],
  }),
}));

// Type Exports
export type Sprint = typeof sprints.$inferSelect & {
  days?: Day[];
  status?: Status;
};
export type Day = typeof days.$inferSelect & {
  sprint?: Sprint;
  events?: Event[]; // ✅ Now properly reflecting one-to-many relationship
  status?: Status;
};
export type Event = typeof events.$inferSelect & {
  day?: Day;
  status?: Status;
  truant?: Truant;
};
export type Truant = typeof truants.$inferSelect & {
  category?: Category;
  priority?: Priority;
  status?: Status;
};
export type Category = typeof categories.$inferSelect;
export type Priority = typeof priorities.$inferSelect;
export type Status = typeof statuses.$inferSelect;
export type TruantWithRelations = typeof truants.$inferSelect & {
  category?: Category;
  priority?: Priority;
  status?: Status;
};
