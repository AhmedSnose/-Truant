// @ts-nocheck
// notion/helpers.ts
import type { Day, Event } from "@/types/general";
import type { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, DATABASE_IDS } from "./client";

// Helper to fetch events for a day
export const fetchEventsForDay = async (dayId: string): Promise<Event[]> => {
  if (!dayId) {
    throw new Error("No day id provided");
  }
  try {
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
        title:
          result.properties["title"]?.title[0]?.text.content || "Untitled Event",
        report: result.properties["report"]?.rich_text[0]?.text.content || "",
        startDate: result.properties["start_time"]?.date?.start || "",
        endDate: result.properties["end_time"]?.date?.start || "",
        description:
          result.properties["description"]?.rich_text[0]?.text.content || "",
        weight: result.properties["weight"]?.number || 0,
      }))
    );
  } catch (error) {
    console.error("Error fetching events for day:", error);
    throw error;
  }
};

// Helper to fetch days associated with a sprint
export const fetchDaysForSprint = async (sprintId: string): Promise<Day[]> => {
  const sprintPage = (await notion.pages.retrieve({
    page_id: sprintId,
  })) as GetPageResponse;

  const daysRelation = sprintPage.properties["days"]?.relation || [];
  return Promise.all(
    daysRelation.map(async (dayRef: any) => {
      const dayPage = (await notion.pages.retrieve({
        page_id: dayRef.id,
      })) as GetPageResponse;
      const events = await fetchEventsForDay(dayRef.id);
      return {
        id: dayRef.id,
        title:
          dayPage.properties["title"]?.title[0]?.text.content || "Untitled Day",
        report:
          dayPage.properties["report"]?.rich_text[0]?.text.content || null,
        goalTime: dayPage.properties["goal time"]?.number || null,
        totalTime: dayPage.properties["total time"]?.number || null,
        date: dayPage.properties["date"]?.date?.start || null,
        events,
      };
    })
  );
};
