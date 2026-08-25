import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

// Supabase Auth owns the identity; our Prisma User table is a separate row
// keyed by the same id. There's no DB trigger syncing the two, so upsert
// lazily on the first authenticated request instead.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const name =
    typeof authUser.user_metadata?.name === "string"
      ? authUser.user_metadata.name
      : null;

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: { email: authUser.email ?? undefined },
    create: {
      id: authUser.id,
      email: authUser.email ?? "",
      name,
    },
  });
}
