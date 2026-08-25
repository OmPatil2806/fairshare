import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

// Supabase Auth owns the identity; our Prisma User table is a separate row
// keyed by the same id. There's no DB trigger syncing the two, so sync
// lazily on the first authenticated request instead.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const metadataName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : null;

  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
  });

  if (!existing) {
    return prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email ?? "",
        name: metadataName,
      },
    });
  }

  // Backfill name for users created before display names existed — never
  // overwrite a name that's already set.
  const shouldBackfillName = !existing.name && metadataName;
  if (!shouldBackfillName && existing.email === authUser.email) {
    return existing;
  }

  return prisma.user.update({
    where: { id: authUser.id },
    data: {
      email: authUser.email ?? undefined,
      name: shouldBackfillName ? metadataName : undefined,
    },
  });
}
