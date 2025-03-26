// @ts-nocheck
// notion/days.ts
import type { Day } from "@/types/general";
import type { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, DATABASE_IDS } from "./client";
import { fetchEventsForDay } from "./helpers";

export const getAllDays = async (
  fetchWithEvents = false,
  startCursor?: string,
  pageSize = 100,
  filter?: { property: string; value: string }
): Promise<{ days: Day[]; nextCursor: string | null }> => {
  const query: any = {
    database_id: DATABASE_IDS.days,
    page_size: pageSize,
    start_cursor: startCursor,
  };

  if (filter) {
    query.filter = {
      property: filter.property,
      [typeof filter.value === "string" ? "rich_text" : "number"]: {
        equals: filter.value,
      },
    };
  }

  const response = (await notion.databases.query(query)) as QueryDatabaseResponse;

  const days = await Promise.all(
    response.results.map(async (result: any) => ({
      id: result.id,
      title: result.properties["title"]?.title[0]?.text.content || "Untitled Day",
      report: result.properties["report"]?.rich_text[0]?.text.content || null,
      goalTime: result.properties["goal_time"]?.number || null,
      totalTime: result.properties["total_time"]?.number || null,
      date: result.properties["date"]?.date?.start || null,
      statusId: result.properties["statusId"].number?.toString(),
      events: fetchWithEvents ? await fetchEventsForDay(result.id) : [],
    }))
  );

  return {
    days,
    nextCursor: response.next_cursor,
  };
};

export const getDayById = async (dayId: string): Promise<Day> => {
  if (!dayId) {
    throw new Error("No day id provided");
  }
  try {
    const response: any = await notion.pages.retrieve({ page_id: dayId });
    const events = await fetchEventsForDay(dayId);
    return {
      id: response.id,
      title: response.properties["title"]?.title[0]?.text.content || "Untitled Day",
      report: response.properties["report"]?.rich_text[0]?.text.content || null,
      goalTime: response.properties["goal_time"]?.number || null,
      totalTime: response.properties["total_time"]?.number || null,
      date: response.properties["date"]?.date?.start || null,
      statusId: response.properties["statusId"].number?.toString(),
      events,
    };
  } catch (err: any) {
    console.error("Error fetching day by ID:", err.message);
    throw new Error(err.message);
  }
};

export const addDay = async (data: {
  title: string;
  report: string | null;
  goalTime: number;
  totalTime: number;
  date: string | null;
  events?: any;
  status?: { id: number };
}): Promise<void> => {
  try {
    await notion.pages.create({
      parent: { database_id: DATABASE_IDS.days },
      properties: {
        title: {
          title: [{ text: { content: data.title } }],
        },
        goal_time: { number: +data.goalTime },
        total_time: { number: +data.totalTime },
        date: { date: { start: data.date } },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        statusId: { number: data.status?.id },
      },
    });
  } catch (error) {
    console.error("Error adding day:", error);
    throw error;
  }
};

export const updateDay = async (
  id: string,
  data: {
    title: string;
    report: string | null;
    goalTime: number;
    totalTime: number;
    date: string | null;
    events?: any;
    status?: { id: number };
  }
): Promise<void> => {
  if (!id) {
    throw new Error("No day id provided");
  }
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        title: { title: [{ text: { content: data.title } }] },
        goal_time: { number: +data.goalTime },
        total_time: { number: +data.totalTime },
        date: { date: { start: data.date } },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        statusId: { number: data.status?.id },
        // Add events relation if needed:
        // Event: { relation: data.events },
      },
    });
  } catch (error) {
    console.error("Error updating day:", error);
    throw error;
  }
};

export const removeDay = async (dayId: string): Promise<void> => {
  try {
    await notion.pages.update({
      page_id: dayId,
      archived: true,
    });
  } catch (error: any) {
    console.error("Failed to remove day:", error);
    throw new Error(`Could not remove day: ${error.message}`);
  }
};
