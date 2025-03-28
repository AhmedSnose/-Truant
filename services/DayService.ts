import { openDatabaseSync } from "expo-sqlite";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { getAllDays } from "@/actions/notion/days";
import { Day } from "@/types/general";
import { getAllEvents } from "@/actions/notion/events";

const DATABASE_NAME = "db";
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
const db = drizzle(expoDb, { schema });

/**
 * Fetch all days with related days
 */
export async function index(): Promise<schema.Day[]> {
  const result = await db.query.days.findMany({
    with: {
      events: true,
    },
  });
  return result as unknown as schema.Day[];
}

/**
 * Fetch a specific day by ID
 */
export async function show(dayId: number) {
  const result = await db.query.days.findFirst({
    where: eq(schema.days.id, dayId),
    with: {
      events: true,
    },
  });
  return result as unknown as schema.Day;
}

/**
 * Insert a new day into the local database
 */
export async function post(data: Omit<schema.Day, "id">) {
  await db.insert(schema.days).values(data);
}

/**
 * Update an existing day in the local database
 */
export async function update(id: number, data: Omit<schema.Day, "id">) {
  await db.update(schema.days).set(data).where(eq(schema.days.id, id));
}

/**
 * Delete a day from the local database
 */
export async function remove(id: number) {
  await db.delete(schema.days).where(eq(schema.days.id, id));
}


function isDayEqual(localDay: schema.Day, apiDay: Day): boolean {
  return (
    localDay.title == apiDay.title &&
    localDay?.date == apiDay.date &&
    localDay.totalTime == apiDay.totalTime &&
    localDay.goalTime == apiDay.goalTime &&
    localDay.report == apiDay.report &&
    localDay.statusId == Number(apiDay.statusId)
  );
}

export async function syncDaysAPIWithLocalDb(): Promise<void> {
  try {
    // Fetch local days from your local DB
    const localDaysList = await index();
    // Fetch API days
    const { days: apiDays } = await getAllDays();

    // Build a map of local days keyed by their referenceId (Notion page ID)
    const localByRef = new Map<string, schema.Day>();
    for (const localDay of localDaysList) {
      if (localDay.referenceId) {
        localByRef.set(localDay.referenceId, localDay);
      }
    }

    // Process each API day
    for (const apiDay of apiDays) {
      const localDay = localByRef.get(apiDay.id!);
      if (localDay) {
        // If exists, check if any relevant field differs
        if (!isDayEqual(localDay, apiDay)) {
          console.log(`Updating local day (id: ${localDay.id}) for API id ${apiDay.id}`);
          await update(localDay.id, {
            title: apiDay.title,
            date:apiDay.date || '',
            totalTime: apiDay.totalTime || 0,
            goalTime: apiDay.goalTime || 0,
            report: apiDay.report,
            statusId: Number(apiDay.statusId),
            referenceId: String(apiDay.id || ''),
            isSynced: 1,
            sprintId:null,
          });
        }
      } else {
        console.log(`Inserting new local day for API id ${apiDay.id}`);
        await post({
          title: apiDay.title,
          date:apiDay.date || '',
          totalTime: apiDay.totalTime || 0,
          goalTime: apiDay.goalTime || 0,
          report: apiDay.report,
          statusId: Number(apiDay.statusId),
          referenceId:apiDay.id!,
          isSynced: 1,
          sprintId:null,
          
        });
      }
    }
    console.log("Sync complete.");
  } catch (error) {
    console.error("Error syncing API with local DB:", error);
    throw error;
  }
}
