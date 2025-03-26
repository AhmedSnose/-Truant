import { openDatabaseSync } from "expo-sqlite";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";

const DATABASE_NAME = "db";
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
const db = drizzle(expoDb, { schema });

/**
 * Fetch all sprints with related days
 */
export async function index(): Promise<schema.Sprint[]> {
  const result = await db.query.sprints.findMany({
    with: {
      days: true,
    },
  });
  return result as unknown as schema.Sprint[];
}


/**
 * Fetch a specific sprint by ID
 */
export async function show(sprintId: number) {
  return await db.query.sprints.findFirst({
    where: eq(schema.sprints.id, sprintId),
    with: {
      days: true,
    },
  });
}

/**
 * Insert a new sprint into the local database
 */
export async function post(data: schema.Sprint) {
  console.log(data, 'data');
  
  await db.insert(schema.sprints).values({
    id: data.id, // Ensure ID matches Notion API if available
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    totalTime: data.totalTime ?? 0,
    goalTime: data.goalTime ?? 0,
    description: data.description ?? "",
    statusId: 1, // Default to "new" status
  });
}

/**
 * Update an existing sprint in the local database
 */
export async function update(id: number, data: schema.Sprint) {
  await db.update(schema.sprints)
    .set({
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      totalTime: data.totalTime ?? 0,
      goalTime: data.goalTime ?? 0,
      description: data.description ?? "",
    })
    .where(eq(schema.sprints.id, id));
}

/**
 * Delete a sprint from the local database
 */
export async function remove(id: number) {
  await db.delete(schema.sprints).where(eq(schema.sprints.id, id));
}
