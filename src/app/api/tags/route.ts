import { NextResponse } from "next/server";
import { getTags } from "@/lib/db/recipes";

export async function GET() {
  const tags = await getTags();
  return NextResponse.json(tags);
}
