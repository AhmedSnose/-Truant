// @ts-nocheck
import { Status as __Status } from "@/db/schema";

import type { Day, Event, FormData, Sprint, Status } from "@/types/general";
import { Client } from "@notionhq/client";
import type {
  GetPageResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

import {
  EXPO_NOTION_TOKEN,
  EXPO_NOTION_SPRINTS_DATABASE_ID,
  EXPO_NOTION_DAYS_DATABASE_ID,
  EXPO_NOTION_EVENTS_DATABASE_ID,
  EXPO_DATABASE_NAME,
} from "@env";

const notionSecret = EXPO_NOTION_TOKEN!;
const NOTION_SPRINTS_DATABASE_ID = process.env.EXPO_NOTION_SPRINTS_DATABASE_ID!;
const NOTION_DAYS_DATABASE_ID = process.env.EXPO_NOTION_DAYS_DATABASE_ID!;
const NOTION_EVENTS_DATABASE_ID = process.env.EXPO_NOTION_EVENTS_DATABASE_ID!;
const notion = new Client({ auth: notionSecret });

// Helper Functions

const fetchDaysForSprint = async (sprintId: string): Promise<Day[]> => {
  const sprintPage = (await notion.pages.retrieve({
    page_id: sprintId,
  })) as GetPageResponse;
  const daysRelation = sprintPage.properties["days"]?.relation || [];

  return Promise.all(
    daysRelation.map(async (dayRef: any) => {
      const dayPage: any = (await notion.pages.retrieve({
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

const fetchEventsForDay = async (dayId: string): Promise<Event[]> => {
  if (!dayId) {
    throw new Error("There is no day id");
  }
  try {
    const response = await notion.databases.query({
      database_id: NOTION_EVENTS_DATABASE_ID,
      filter: {
        property: "day",
        relation: {
          contains: dayId,
        },
      },
    });

    return await Promise.all(
      response.results.map(async (result: any) => {
        return {
          id: result.id as string,
          title:
            (result.properties["title"]?.title[0]?.text.content as string) ||
            "Untitled Event",
          report: result.properties["report"]?.rich_text[0]?.text
            .content as string,
          startDate: result.properties["start_time"]?.date?.start as string,
          endDate: result.properties["end_time"]?.date?.start as string,
          description: result.properties["description"]?.rich_text[0]?.text
            .content as string,
          weight: result.properties["weight"]?.number as number,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching events for day:", error);
    throw error;
  }
};

// Sprint Functions

export const getAllSprintsWithDetails = async (): Promise<Sprint[]> => {
  const query = (await notion.databases.query({
    database_id: NOTION_SPRINTS_DATABASE_ID,
  })) as QueryDatabaseResponse;

  return Promise.all(
    query.results.map(async (result: any) => {
      const days = await fetchDaysForSprint(result.id);

      return {
        id: result.id,
        title:
          result.properties["title"]?.title[0]?.text.content ||
          "Untitled Sprint",
        totalTime: result.properties["total time"]?.number || null,
        goalTime: result.properties["goal time"]?.number || null,
        startDate: result.properties["start date"]?.date?.start || null,
        endDate: result.properties["end date"]?.date?.start || null,
        description:
          result.properties["description"]?.rich_text[0]?.text.content || null,
        days,
      };
    })
  );
};

export const getAllSprints = async (): Promise<Sprint[]> => {
  const query = (await notion.databases.query({
    database_id: NOTION_SPRINTS_DATABASE_ID,
  })) as QueryDatabaseResponse;

  return query.results.map((result: any) => ({
    id: result.id,
    title:
      result.properties["title"]?.title[0]?.text.content || "Untitled Sprint",
    totalTime: result.properties["total time"]?.number || null,
    goalTime: result.properties["goal time"]?.number || null,
    startDate: result.properties["start date"]?.date?.start || null,
    endDate: result.properties["end date"]?.date?.start || null,
    description:
      result.properties["description"]?.rich_text[0]?.text.content || null,
  }));
};

export const getSprintById = async (
  sprintId: string
): Promise<Sprint | null> => {
  if (!sprintId) {
    // throw new Error("There is no sprint id");
    return new Promise(() => {});
  }
  try {
    const response: any = await notion.pages.retrieve({ page_id: sprintId });
    const days = await fetchDaysForSprint(response.id);

    return {
      id: response.id,
      title:
        response.properties["title"]?.title[0]?.text.content ||
        "Untitled Sprint",
      totalTime: response.properties["total time"]?.number || null,
      goalTime: response.properties["goal time"]?.number || null,
      startDate: response.properties["start date"]?.date?.start || null,
      endDate: response.properties["end date"]?.date?.start || null,
      description:
        response.properties["description"]?.rich_text[0]?.text.content || null,
      days,
    };
  } catch (err: any) {
    console.error("Error fetching sprint by ID:", err.message);
    throw new Error(err.message);
  }
};

export const createSprint = async (data: FormData): Promise<void> => {
  if (!notionSecret || !NOTION_SPRINTS_DATABASE_ID) {
    throw new Error("Missing Notion secret or database ID.");
  }

  await notion.pages.create({
    parent: { database_id: NOTION_SPRINTS_DATABASE_ID },
    properties: {
      title: {
        title: [
          {
            text: {
              content: data.title,
            },
          },
        ],
      },
      "goal time": {
        number: Number.parseFloat(data.goalTime),
      },
      "total time": {
        number: Number.parseFloat(data.totalTime),
      },
      "start date": {
        date: { start: data.startDate },
      },
      "end date": {
        date: { start: data.endDate },
      },
      description: {
        rich_text: [
          {
            text: {
              content: data.description,
            },
          },
        ],
      },
    },
  });
};

export const updateSprint = async (
  id: string,
  data: {
    days: any;
    id: string;
    title: string;
    totalTime: string | null;
    goalTime: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }
): Promise<void> => {
  try {
    const result = await notion.pages.update({
      page_id: id,
      properties: {
        title: {
          title: [
            {
              text: {
                content: data.title,
              },
            },
          ],
        },
        "goal time": {
          number: Number.parseFloat(data.goalTime),
        },
        "total time": {
          number: Number.parseFloat(data.totalTime),
        },
        "start date": {
          date: { start: data.startDate },
        },
        "end date": {
          date: { start: data.endDate },
        },
        description: {
          rich_text: [
            {
              text: {
                content: data.description,
              },
            },
          ],
        },
        days: {
          relation: data.days,
        },
      },
    });
  } catch (error) {
    console.error("Error updating sprint:", error);
    throw error;
  }
};

export const removeSprint = async (sprintId: string): Promise<void> => {
  try {
    await notion.pages.update({
      page_id: sprintId,
      archived: true,
    });
  } catch (error: any) {
    console.error("Failed to remove sprint:", error);
    throw new Error(`Could not remove sprint: ${error.message}`);
  }
};

// Day Functions

export const getAllDays = async (
  fetchWithEvents = false,
  startCursor?: string,
  pageSize = 10,
  filter?: { property: string; value: string }
): Promise<{ days: Day[]; nextCursor: string | null }> => {
  const query: any = {
    database_id: NOTION_DAYS_DATABASE_ID,
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

  const response = (await notion.databases.query(
    query
  )) as QueryDatabaseResponse;

  const days = await Promise.all(
    response.results.map(async (result: any) => {
      return {
        id: result.id,
        title:
          result.properties["title"]?.title[0]?.text.content || "Untitled Day",
        report: result.properties["report"]?.rich_text[0]?.text.content || null,
        goalTime: result.properties["goal_time"]?.number || null,
        totalTime: result.properties["total_time"]?.number || null,
        date: result.properties["date"]?.date?.start || null,
        statusId: result.properties["statusId"].number?.toString(),
        events: fetchWithEvents ? await fetchEventsForDay(result.id) : [],
      };
    })
  );

  return {
    days,
    nextCursor: response.next_cursor,
  };
};

export const getDayById = async (dayId: string): Promise<Day> => {
  if (!dayId) {
    throw new Error("There is no day id");
  }
  try {
    const response: any = await notion.pages.retrieve({ page_id: dayId });
    const events = await fetchEventsForDay(dayId);

    const day = {
      id: response.id,
      title:
        response.properties["title"]?.title[0]?.text.content || "Untitled Day",
      report: response.properties["report"]?.rich_text[0]?.text.content || null,
      goalTime: response.properties["goal_time"]?.number || null,
      totalTime: response.properties["total_time"]?.number || null,
      date: response.properties["date"]?.date?.start || null,
      statusId: response.properties["statusId"].number?.toString(),
      events,
    };
    return day;
  } catch (err: any) {
    console.error("Error fetching day by ID:", err.message);
    throw new Error(err.message);
  }
};

export const addDay = async (data: {
  id?: string;
  title: string;
  report: string | null;
  goalTime: number;
  totalTime: number;
  date: string | null;
  events?: any;
  status?: __Status;
  statusId?: string;
}): Promise<void> => {
  try {
    console.log(data,'data');
    
    const result = await notion.pages.create({
      parent: { database_id: NOTION_DAYS_DATABASE_ID },
      properties: {
        title: {
          title: [
            {
              text: {
                content: data.title,
              },
            },
          ],
        },
        goal_time: {
          number: +data.goalTime,
        },
        total_time: {
          number: +data.totalTime,
        },
        date: {
          date: { start: data.date },
        },
        report: {
          rich_text: [
            {
              text: {
                content: data.report || "",
              },
            },
          ],
        },
        statusId: {
          number: data.status?.id,
        },
        // Event: {
        //   relation: data.events,
        // },
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
    id?: string;
    title: string;
    report: string | null;
    goalTime: number;
    totalTime: number;
    date: string | null;
    events?: any;
    status?: __Status;
    statusId?: string;
  }
): Promise<void> => {
  if (!id) {
    throw new Error("There is no sprint id");
  }
  try {
    const result = await notion.pages.update({
      page_id: id,
      properties: {
        title: {
          title: [
            {
              text: {
                content: data.title,
              },
            },
          ],
        },
        goal_time: {
          number: +data.goalTime,
        },
        total_time: {
          number: +data.totalTime,
        },
        date: {
          date: { start: data.date },
        },
        report: {
          rich_text: [
            {
              text: {
                content: data.report || "",
              },
            },
          ],
        },
        statusId: {
          number: Number(data?.status?.id),
        },
        Event: {
          relation: data.events,
        },
      },
    });
    console.log(result, "----", data, "result");
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

// Event Functions

export const getAllEvents = async (
  startCursor?: string,
  pageSize = 10
): Promise<{ events: Event[]; nextCursor: string | null }> => {
  const query = (await notion.databases.query({
    database_id: NOTION_EVENTS_DATABASE_ID,
    page_size: pageSize,
    start_cursor: startCursor,
  })) as QueryDatabaseResponse;

  const events = await Promise.all(
    query.results.map(async (result: any) => {
      return {
        id: result.id,
        title:
          result.properties["title"]?.title[0]?.text.content ||
          "Untitled Event",
        startTime:
          result.properties["start_time"]?.rich_text[0]?.text.content || null,
        endTime:
          result.properties["end_time"]?.rich_text[0]?.text.content || null,
        description:
          result.properties["description"]?.rich_text[0]?.text.content || null,
        weight: result.properties["weight"]?.number || null,
        timeTaken: result.properties["time_taken"]?.number || null,
        report: result.properties["report"]?.rich_text[0]?.text.content || null,
      };
    })
  );

  return {
    events,
    nextCursor: query.next_cursor,
  };
};

export const getEventsWithinDay = async (dayId: string): Promise<Event[]> => {
  return fetchEventsForDay(dayId);
};

export const getEventById = async (eventId: string): Promise<Event | null> => {
  if (!eventId) {
    throw new Error("There is no event id");
  }
  try {
    const response: any = await notion.pages.retrieve({ page_id: eventId });

    return {
      id: response.id,
      title:
        response.properties["title"]?.title[0]?.text.content ||
        "Untitled Event",
      start_time:
        response.properties["start_time"]?.rich_text[0]?.text.content || null,
      end_time:
        response.properties["end_time"]?.rich_text[0]?.text.content || null,

      // startDate: response.properties["start_time"]?.date?.start || null,
      // endDate: response.properties["end_time"]?.date?.end || null,
      statusId: response.properties["statusId"].number?.toString(),
      truantId: response.properties["truantId"].number?.toString(),
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
      parent: { database_id: NOTION_EVENTS_DATABASE_ID },
      properties: {
        title: {
          title: [{ text: { content: data.title } }],
        },
        start_time: {
          rich_text: [{ text: { content: data.start_time || "" } }],
          // date: { start: data.start_time },
        },
        end_time: {
          rich_text: [{ text: { content: data.end_time || "" } }],
          // date: { start: data.end_time },
        },
        // startDate: {
        //   date: { start: data.startDate },
        // },
        // endDate: {
        //   date: { start: data.endDate },
        // },
        description: {
          rich_text: [{ text: { content: data.description || "" } }],
        },
        weight: {
          number: data.weight,
        },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        truantId: {
          number: Number.parseInt(data.truantId!),
        },
        statusId: {
          number: Number.parseInt(data.statusId!),
        },
      },
    });
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

export const updateEvent = async (id: string, data: Event): Promise<void> => {
  if (!id) {
    throw new Error("There is no event id");
  }
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        title: {
          title: [{ text: { content: data.title } }],
        },
        start_time: {
          rich_text: [{ text: { content: data.start_time || "" } }],
          // date: { start: data.start_time },
        },
        end_time: {
          rich_text: [{ text: { content: data.end_time || "" } }],
          // date: { start: data.end_time },
        },
        // startDate: {
        //   date: { start: data.startDate },
        // },
        // endDate: {
        //   date: { start: data.endDate },
        // },
        description: {
          rich_text: [{ text: { content: data.description || "" } }],
        },
        weight: {
          number: data.weight,
        },
        report: {
          rich_text: [{ text: { content: data.report || "" } }],
        },
        truantId: {
          number: Number.parseInt(data.truantId!),
        },
        statusId: {
          number: Number.parseInt(data.statusId!),
        },
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
