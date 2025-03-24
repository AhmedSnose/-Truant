"use server";

import { truants } from '@/db/schema';
import { TruantResponse } from '@/types/general';
export type TruantInsert = typeof truants.$inferInsert;

export default async function store(db:any,data: TruantInsert): Promise<TruantResponse> {
  const result = await db
    .insert(truants)
    .values(data)
    .returning()
    .get();

  return result!;
}