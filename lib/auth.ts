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

  // A plain findUnique-then-create/update here is a TOCTOU race: two
  // concurrent calls for the same brand-new user (React double-invocation,
  // overlapping requests, a retry) can both see "doesn't exist" and both
  // try to insert, and the second one throws a unique constraint error.
  // upsert() keyed on the unique `id` compiles to a single atomic
  // `INSERT ... ON CONFLICT DO UPDATE`, so concurrent calls can't race.
  const user = await prisma.user.upsert({
    where: { id: authUser.id },
    update: { email: authUser.email ?? undefined },
    create: {
      id: authUser.id,
      email: authUser.email ?? "",
      name: metadataName,
    },
  });

  // Backfill name for users created before display names existed. Guarded
  // by `name: null` in the WHERE clause so this is itself race-safe and
  // never overwrites a name that's already set (by this call or another
  // concurrent one).
  if (!user.name && metadataName) {
    const backfilled = await prisma.user.updateMany({
      where: { id: authUser.id, name: null },
      data: { name: metadataName },
    });
    if (backfilled.count > 0) {
      user.name = metadataName;
    }
  }

  return user;
}
