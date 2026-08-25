import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserGroups } from "@/lib/groups";
import { getCurrencySymbol } from "@/lib/currency";
import { cardClass, mutedTextClass } from "@/lib/ui";
import { CreateGroupForm } from "./CreateGroupForm";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your groups
      </h1>

      <CreateGroupForm />

      {groups.length === 0 ? (
        <p className={`mt-8 ${mutedTextClass}`}>
          You don&apos;t have any groups yet — create your first one above!
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className={`flex flex-wrap items-center justify-between gap-2 ${cardClass}`}
            >
              <Link
                href={`/groups/${group.id}`}
                className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
              >
                {group.name} ({getCurrencySymbol(group.currency)})
              </Link>
              <span className={mutedTextClass}>
                {group._count.members}{" "}
                {group._count.members === 1 ? "member" : "members"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
