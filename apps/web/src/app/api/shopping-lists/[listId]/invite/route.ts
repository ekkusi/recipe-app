import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ listId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { listId } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("shopping_list_members")
    .select("user_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .single();
  if (!data) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("invite_token")
    .eq("id", listId)
    .single();
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ url: `${appUrl}/join/${list.invite_token}` });
}
