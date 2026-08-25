import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
        <Link
          href="/groups"
          className="font-semibold text-zinc-900 dark:text-zinc-50"
        >
          FairShare
        </Link>
        <LogoutButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
