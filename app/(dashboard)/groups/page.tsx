import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserGroups } from "@/lib/groups";
import { CreateGroupForm } from "./CreateGroupForm";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your groups
      </h1>

      <CreateGroupForm />

      {groups.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;re not in any groups yet. Create one above to get started.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {group.name}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
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
