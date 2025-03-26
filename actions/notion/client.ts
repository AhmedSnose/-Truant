import { Client } from "@notionhq/client";

import {
    EXPO_NOTION_TOKEN,
    EXPO_NOTION_SPRINTS_DATABASE_ID,
    EXPO_NOTION_DAYS_DATABASE_ID,
    EXPO_NOTION_EVENTS_DATABASE_ID,
    EXPO_DATABASE_NAME,
    // @ts-ignore
  } from "@env";

if (!EXPO_NOTION_TOKEN) {
  throw new Error("Missing Notion secret");
}

export const notion = new Client({ auth: EXPO_NOTION_TOKEN });
export const DATABASE_IDS = {
  sprints: process.env.EXPO_NOTION_SPRINTS_DATABASE_ID!,
  days: process.env.EXPO_NOTION_DAYS_DATABASE_ID!,
  events: process.env.EXPO_NOTION_EVENTS_DATABASE_ID!,
};
