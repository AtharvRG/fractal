This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Fractal Sharing

Fractal encodes your project (structure + text files, binary placeholders) client-side into a compressed binary pack then Brotli/Gzip and base64url inside a `#h:` fragment. Nothing is uploaded unless you explicitly create a Gist or a shortened record.

### Supabase Short Links (Optional)

Set up a Supabase table if you want durable shortened IDs (instead of the very long `#h:`):

```sql
create table short_links (
	id text primary key,
	payload text not null,
	created_at timestamptz default now(),
	expires_at timestamptz,
	hit_count int default 0
);
create index on short_links (expires_at);
```

Environment variables (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
```

API Endpoints:
- POST `/api/shorten` body: `{ "payload": "<full_h_remainder>", "ttlSeconds": 3600 }` -> `{ id, expires_at }`
- GET `/api/shorten?id=<id>` -> `{ payload }`
- DELETE `/api/shorten?id=<id>` -> `{ ok: true }`

Use the returned `id` as `#sb:<id>` in the editor URL. The loader expands it to a full `#h:` link (and swaps the hash) so subsequent refreshes are self-contained.

TTL is capped at 30 days; you can extend logic server-side for purging expired rows via a cron / scheduled function.
