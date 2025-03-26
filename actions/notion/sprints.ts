// @ts-nocheck
// notion/sprints.ts
import * as schema from "@/db/schema";

import type { Sprint, FormData } from "@/types/general";
import type { QueryDatabaseResponse } from "@notionhq/client/build/src/api-endpoints";
import { notion, DATABASE_IDS } from "./client";
import { fetchDaysForSprint } from "./helpers";

export const getAllSprintsWithDetails = async (): Promise<Sprint[]> => {
  const query = (await notion.databases.query({
    database_id: DATABASE_IDS.sprints,
  })) as QueryDatabaseResponse;

  return Promise.all(
    query.results.map(async (result: any) => {
      const days = await fetchDaysForSprint(result.id);
      return {
        id: result.id,
        title:
          result.properties["title"]?.title[0]?.text.content || "Untitled Sprint",
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

export const getAllSprints = async (): Promise<schema.Sprint[]> => {
  const query = (await notion.databases.query({
    database_id: DATABASE_IDS.sprints,
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

export const getSprintById = async (sprintId: number): Promise<schema.Sprint | null> => {
  if (!sprintId) {
    throw new Error("No sprint id provided");
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
  if (!DATABASE_IDS.sprints) {
    throw new Error("Missing Notion database ID for sprints.");
  }
  await notion.pages.create({
    parent: { database_id: DATABASE_IDS.sprints },
    properties: {
      title: {
        title: [{ text: { content: data.title } }],
      },
      "goal time": { number: Number.parseFloat(data.goalTime) },
      "total time": { number: Number.parseFloat(data.totalTime) },
      "start date": { date: { start: data.startDate } },
      "end date": { date: { start: data.endDate } },
      description: {
        rich_text: [{ text: { content: data.description } }],
      },
    },
  });
};

export const updateSprint = async (
  id: string,
  data: {
    days: any;
    title: string;
    totalTime: string | null;
    goalTime: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }
): Promise<void> => {
  try {
    await notion.pages.update({
      page_id: id,
      properties: {
        title: { title: [{ text: { content: data.title } }] },
        "goal time": { number: Number.parseFloat(data.goalTime) },
        "total time": { number: Number.parseFloat(data.totalTime) },
        "start date": { date: { start: data.startDate } },
        "end date": { date: { start: data.endDate } },
        description: {
          rich_text: [{ text: { content: data.description } }],
        },
        days: { relation: data.days },
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
