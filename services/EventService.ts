import { openDatabaseSync } from "expo-sqlite";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { getAllEvents } from "@/actions/notion/events";
import { Event } from "@/types/general";

const DATABASE_NAME = "db";
const expoDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
const db = drizzle(expoDb, { schema });

/**
 * Fetch all sprints with related days
 */
export async function index(): Promise<schema.Event[]> {
  const result = await db.query.events.findMany();
  return result as unknown as schema.Event[];
}

/**
 * Fetch a specific sprint by ID
 */
export async function show(id: number) {
  const result = await db.query.events.findFirst({
    where: eq(schema.events.id, id),
  });
  return result as unknown as schema.Event;
}

/**
 * Insert a new sprint into the local database
 */
export async function post(data:  Omit<schema.Event, "id">) {
  await db.insert(schema.events).values(data);
}

/**
 * Update an existing sprint in the local database
 */
export async function update(id: number, data: Omit<schema.Event, "id">) {
  await db.update(schema.events).set(data).where(eq(schema.events.id, id));
}

/**
 * Delete a sprint from the local database
 */
export async function remove(id: number) {
  await db.delete(schema.events).where(eq(schema.events.id, id));
}



function isEventEqual(localEvent: schema.Event, apiEvent: Event): boolean {
  return (
    localEvent.title === apiEvent.title &&
    Number(localEvent.startTime) === Number(apiEvent.start_time) &&
    Number(localEvent.endTime) === Number(apiEvent.end_time) &&
    localEvent.description === apiEvent.description &&
    localEvent.weight === apiEvent.weight &&
    localEvent.report === apiEvent.report &&
    localEvent.statusId === Number(apiEvent.statusId) &&
    localEvent.truantId === (apiEvent.truantId || null)
  );
}

export async function syncEventsAPIWithLocalDb(): Promise<void> {
  try {
    // Fetch local events from the local database
    const localEventsList = await index();
    // Fetch events from Notion API
    const { events: apiEvents } = await getAllEvents();

    // Build a map of local events keyed by their referenceId (Notion event ID)
    const localByRef = new Map<string, schema.Event>();
    for (const localEvent of localEventsList) {
      if (localEvent.referenceId) {
        localByRef.set(localEvent.referenceId, localEvent);
      }
    }

    // Process each API event
    for (const apiEvent of apiEvents) {
      const localEvent = localByRef.get(apiEvent.id!);
      if (localEvent) {
        // If the local event exists, check if key fields differ
        if (!isEventEqual(localEvent, apiEvent)) {
          console.log(`Updating local event (id: ${localEvent.id}) for API id ${apiEvent.id}`);
          await update(localEvent.id, {
            title: apiEvent.title,
            startTime: Number(apiEvent.start_time),
            endTime: Number(apiEvent.end_time),
            description: apiEvent.description,
            weight: apiEvent.weight,
            report: apiEvent.report,
            statusId: Number(apiEvent.statusId),
            truantId: apiEvent.truantId || null,
            referenceId: apiEvent.id!,
            isSynced: 1,
            dayId: localEvent.dayId,
          });
        }
      } else {
        console.log(`Inserting new local event for API id ${apiEvent.id}`);
        await post({
          title: apiEvent.title,
          startTime: Number(apiEvent.start_time),
          endTime: Number(apiEvent.end_time),
          description: apiEvent.description,
          weight: apiEvent.weight,
          report: apiEvent.report,
          statusId: Number(apiEvent.statusId),
          truantId: apiEvent.truantId || null,
          referenceId: apiEvent.id!,
          isSynced: 1,
          dayId: 0, 
        });
      }
    }
    console.log("Sync complete.");
  } catch (error) {
    console.error("Error syncing API with local DB:", error);
    throw error;
  }
}
