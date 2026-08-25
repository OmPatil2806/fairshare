import Link from "next/link";
import { buttonPrimaryClass, buttonSecondaryClass } from "@/lib/ui";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black sm:px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          FairShare
        </h1>
        <p className="mt-3 text-lg font-medium text-zinc-600 dark:text-zinc-400">
          Split bills with friends, the fair way.
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Track shared expenses with roommates, trips, and groups. FairShare
          keeps a running tally of who paid for what, works out the simplest
          way to settle up, and reminds people when they still owe you.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={`${buttonPrimaryClass} w-full sm:w-auto`}>
            Sign Up
          </Link>
          <Link href="/login" className={`${buttonSecondaryClass} w-full sm:w-auto`}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
