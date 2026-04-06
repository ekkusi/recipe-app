import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clearCheckedItems } from "@/lib/db/shopping-list";

type Params = { params: Promise<{ listId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearCheckedItems(listId, userId);
  return NextResponse.json({ ok: true });
}
