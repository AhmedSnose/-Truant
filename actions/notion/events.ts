// @ts-nocheck
// notion/events.ts
import type { Event } from "@/types/general";
import type { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, DATABASE_IDS } from "./client";

export const getAllEvents = async (
  startCursor?: string,
  pageSize = 1000
): Promise<{ events: Event[]; nextCursor: string | null }> => {
  const query = await notion.databases.query({
    database_id: DATABASE_IDS.events,
    page_size: pageSize,
    start_cursor: startCursor,
  }) as QueryDatabaseResponse;

  const events = await Promise.all(
    query.results.map(async (result: any) => ({
      id: result.id,
      title: result.properties["title"]?.title[0]?.text.content || "Untitled Event",
      startTime: result.properties["start_time"]?.rich_text[0]?.text.content || null,
      endTime: result.properties["end_time"]?.rich_text[0]?.text.content || null,
      description: result.properties["description"]?.rich_text[0]?.text.content || null,
      weight: result.properties["weight"]?.number || null,
      timeTaken: result.properties["time_taken"]?.number || null,
      report: result.properties["report"]?.rich_text[0]?.text.content || null,
    }))
  );

  return {
    events,
    nextCursor: query.next_cursor,
  };
};

export const getEventsWithinDay = async (dayId: string): Promise<Event[]> => {
  if (!dayId) {
    throw new Error("No day id provided");
  }
  // We can reuse the logic from getAllEvents by filtering,
  // but if you already have a helper for this, consider reusing it.
  const response = await notion.databases.query({
    database_id: DATABASE_IDS.events,
    filter: {
      property: "day",
      relation: {
        contains: dayId,
      },
    },
  });
  return Promise.all(
    response.results.map(async (result: any) => ({
      id: result.id,
      title: result.properties["title"]?.title[0]?.text.content || "Untitled Event",
      startTime: result.properties["start_time"]?.rich_text[0]?.text.content || null,
      endTime: result.properties["end_time"]?.rich_text[0]?.text.content || null,
      description: result.properties["description"]?.rich_text[0]?.text.content || null,
      weight: result.properties["weight"]?.number || null,
      timeTaken: result.properties["time_taken"]?.number || null,
      report: result.properties["report"]?.rich_text[0]?.text.content || null,
    }))
  );
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  if (!eventId) {
    throw new Error("No event id provided");
  }
  try {
    const response: any = await notion.pages.retrieve({ page_id: eventId });
    return {
      id: response.id,
      title:
        response.properties["title"]?.title[0]?.text.content || "Untitled Event",
      start_time:
        response.properties["start_time"]?.rich_text[0]?.text.content || null,
      end_time:
        response.properties["end_time"]?.rich_text[0]?.text.content || null,
      statusId: response.properties["statusId"]?.number?.toString(),
      truantId: response.properties["truantId"]?.number?.toString(),
      description:
        response.properties["description"]?.rich_text[0]?.text.content || null,
      weight: response.properties["weight"]?.number || null,
      report: response.properties["report"]?.rich_text[0]?.text.content || null,
    };
  } catch (err: any) {
    console.error("Error fetching event by ID:", err.message);
    throw new Error(err.message);
  }
};

export const addEvent = async (data: Event): Promise<void> => {
  try {
    await notion.pages.create({
      parent: { database_id: DATABASE_IDS.events },
      properties: {
        title: { title: [{ text: { content: data.title } }] },
        start_time: {
          rich_text: [{ text: { content: data.start_time || "" } }],
        },
        end_time: {
          rich_text: [{ text: { content: data.end_time || "" } }],
        },
        description: {
          rich_text: [{ text: { content: data.description || "" } }],
        },
        weight: { number: data.weight },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        truantId: { number: Number.parseInt(data.truantId!) },
        statusId: { number: Number.parseInt(data.statusId!) },
      },
    });
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const updateEvent = async (id: string, data: Event): Promise<void> => {
  if (!id) {
    throw new Error("No event id provided");
  }
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        title: { title: [{ text: { content: data.title } }] },
        start_time: {
          rich_text: [{ text: { content: data.start_time || "" } }],
        },
        end_time: {
          rich_text: [{ text: { content: data.end_time || "" } }],
        },
        description: {
          rich_text: [{ text: { content: data.description || "" } }],
        },
        weight: { number: data.weight },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        truantId: { number: Number.parseInt(data.truantId!) },
        statusId: { number: Number.parseInt(data.statusId!) },
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

export const removeEvent = async (eventId: string): Promise<void> => {
  try {
    await notion.pages.update({
      page_id: eventId,
      archived: true,
    });
  } catch (error: any) {
    console.error("Failed to remove event:", error);
    throw new Error(`Could not remove event: ${error.message}`);
  }
};
