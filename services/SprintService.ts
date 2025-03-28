import { openDatabaseSync } from "expo-sqlite";
import * as schema from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { getAllSprints } from "@/actions/notion/sprints";

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
  const result = await db.query.sprints.findFirst({
    where: eq(schema.sprints.id, sprintId),
    with: {
      days: true,
    },
  });
  return result as unknown as schema.Sprint;
}

/**
 * Insert a new sprint into the local database
 */
export async function post(data: schema.Sprint) {
  await db.insert(schema.sprints).values({
    id: data.id,
    title: data.title,
    startDate: data.startDate,
    endDate: data.endDate,
    totalTime: data.totalTime ?? 0,
    goalTime: data.goalTime ?? 0,
    description: data.description ?? "",
    statusId: 1,
    isSynced:data.isSynced,
    referenceId:data.referenceId
  });
}

/**
 * Update an existing sprint in the local database
 */
export async function update(id: number, data: schema.Sprint) {
  return await db
    .update(schema.sprints)
    .set(data)
    .where(eq(schema.sprints.id, id));
}

/**
 * Delete a sprint from the local database
 */
export async function remove(id: number) {
  await db.delete(schema.sprints).where(eq(schema.sprints.id, id));
}
export async function linkDaysToSprint(sprintId: number, dayIds: number[]) {
  await db
    .update(schema.days)
    .set({ sprintId })
    .where(inArray(schema.days.id, dayIds));

  await db
    .update(schema.sprints)
    .set({ isSynced: 0 })
    .where(eq(schema.sprints.id, sprintId));
}

export async function syncSprintsAPIWithLocalDb(): Promise<void> {
  try {
    const localSprintsList = await index();
    const _apiSprints = await getAllSprints();
    const apiSprints = _apiSprints.filter(
      (apiSprint) =>
        !localSprintsList.some(
          (localSprint) => (localSprint.title === apiSprint.title) && localSprint.referenceId == apiSprint.id.toString()
        )
    );

    const localSprintMap = new Map(
      localSprintsList.map((sprint) => [sprint.id, sprint])
    );

    for (const apiSprint of apiSprints) {
      if (localSprintMap.has(apiSprint.id)) {
        console.log(`Updating sprint with id ${apiSprint.id}`);
        await update(apiSprint.id, apiSprint);
      } else {
        console.log(`Inserting new sprint with id ${apiSprint.id}`);
        await post({
          description: apiSprint.description,
          endDate: apiSprint.endDate,
          goalTime: apiSprint.goalTime,
          isSynced: 1,
          statusId: apiSprint.statusId,
          title: apiSprint.title,
          startDate: apiSprint.startDate,
          totalTime: apiSprint.totalTime,
          // @ts-ignore
          referenceId: apiSprint.id,
        });
      }
    }

    console.log("Sync complete.");
  } catch (error) {
    console.error("Error syncing API with local DB:", error);
    throw error;
  }
}
