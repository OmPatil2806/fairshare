# FairShare

A bill-splitter app for groups, trips, and shared households — track shared expenses, split them fairly, and settle up without the awkward math.

**Live App:** [FairShare](https://fairshare-three.vercel.app/)

## Why FairShare

Splitting costs with other people is always more annoying than it should be — a trip with friends, rent and groceries with roommates, or any other shared expense situation ends up as a pile of half-remembered IOUs and "wait, who paid for what again?" conversations. FairShare keeps a running, always-up-to-date tally of who paid for what and who owes whom, so nobody has to do the math by hand or take anyone else's word for it. Everyone in the group can check the current balance at any time, and settling up comes down to the smallest possible number of payments instead of untangling a web of individual debts.

## Features

- **Authentication** — email/password sign-up and login
- **Groups** — create groups with a base currency (INR, USD, or EUR) and invite members
- **Expense tracking** — log expenses and split them equally, by custom amounts, or by percentage
- **Balances** — automatic balance calculation with debt simplification, so the group settles with the fewest possible transactions
- **Settle up** — record partial or full payments between members
- **Payment reminders** — send email nudges to members who owe money
- **Activity feed** — a running log of what's happened in each group

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Resend](https://resend.com/) for transactional email
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd fairshare
npm install
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

## Project Structure

```
app/          # Next.js App Router routes, layouts, and API endpoints
lib/          # Core business logic — auth, groups, expenses, balances, settlements, email
prisma/       # Database schema and migrations
components/   # Shared React components
```

## License

<<<<<<< HEAD
Personal project — not currently licensed for reuse.
=======
## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy  Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
>>>>>>> ee98d7433d57ead9f2478d1189a61d5369f5719a
