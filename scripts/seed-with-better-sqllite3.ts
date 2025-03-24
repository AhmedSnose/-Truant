import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema";

export async function seed(db: BetterSQLite3Database<typeof schema>) {
  await db.transaction(async (tx) => {
    // Insert priorities
    await tx
      .insert(schema.priorities)
      .values([
        { value: "very-high" },
        { value: "high" },
        { value: "medium" },
        { value: "low" },
      ])
      .onConflictDoNothing();

    // Insert statuses
    await tx
      .insert(schema.statuses)
      .values([{ value: "done" }, { value: "in-progress" }, { value: "new" }])
      .onConflictDoNothing();

    // Insert parent categories
    await tx
      .insert(schema.categories)
      .values([{ title: "Work" }, { title: "Personal" }])
      .onConflictDoNothing();

    // Get parent categories
    const workParent = await tx
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.title, "Work"));
    const personalParent = await tx
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.title, "Personal"));

    // Insert child categories
    if (workParent.length > 0) {
      await tx
        .insert(schema.categories)
        .values([
          { title: "Projects", parentId: workParent[0].id },
          { title: "Meetings", parentId: workParent[0].id },
        ])
        .onConflictDoNothing();
    }

    if (personalParent.length > 0) {
      await tx
        .insert(schema.categories)
        .values([
          { title: "Shopping", parentId: personalParent[0].id },
          { title: "Family", parentId: personalParent[0].id },
        ])
        .onConflictDoNothing();
    }

    // Get references for truants
    const veryHighPriority = await tx
      .select()
      .from(schema.priorities)
      .where(eq(schema.priorities.value, "very-high"));
    const newStatus = await tx
      .select()
      .from(schema.statuses)
      .where(eq(schema.statuses.value, "new"));
    const projectsCategory = await tx
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.title, "Projects"));

    // Insert sample truants
    if (veryHighPriority[0] && newStatus[0] && projectsCategory[0]) {
      await tx
        .insert(schema.truants)
        .values([
          {
            title: "Launch Marketing Campaign",
            description: "Finalize and launch Q3 marketing campaign",
            categoryId: projectsCategory[0].id,
            priorityId: veryHighPriority[0].id,
            statusId: newStatus[0].id,
            link: "https://example.com/campaign",
          },
          {
            title: "Update Client Contracts",
            description: "Review and update expiring client contracts",
            categoryId: projectsCategory[0].id,
            priorityId: veryHighPriority[0].id,
            statusId: newStatus[0].id,
          },
        ])
        .onConflictDoNothing();
    }
  });
}

const run = async () => {
  const sqlite = new Database('db.db');
  const db = drizzle(sqlite, { 
    schema,
    logger: true // Optional: enable query logging
  });
    
  try {
    await seed(db);
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    sqlite.close();
  }
};

run();