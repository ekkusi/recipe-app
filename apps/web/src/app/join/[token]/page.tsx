import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { joinShoppingList } from "@/lib/db/shopping-list";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/join/${token}`);
  }

  try {
    const listId = await joinShoppingList(token, userId);
    redirect(`/shopping-list?list=${listId}`);
  } catch {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <p className="text-muted-foreground">Virheellinen kutsulink</p>
      </div>
    );
  }
}
