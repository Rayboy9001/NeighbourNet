# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

This project uses **npm** as its only package manager (`package-lock.json` is the committed lockfile — do not add bun/yarn/pnpm lockfiles). You need Node.js 20+ and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm ci                 # or `npm install` when adding dependencies
cp .env.example .env   # then fill in your values
npm run dev
```

### npm scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Production build. |
| `npm run build:dev` | Build in development mode. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run format` | Format with Prettier. |
| `npm test` | Run the Vitest suite once. |


## Environment variables

Copy `.env.example` to `.env` and fill in the values. Only `.env.example` is committed; every other env file is git-ignored.

### Required for the app to boot

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | server | Backend project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | server | Publishable (anon) key — safe to expose, protected by RLS. |
| `SUPABASE_PROJECT_ID` | server | Project reference id. |
| `VITE_SUPABASE_URL` | browser | Same URL, exposed to the client bundle. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Same publishable key. |
| `VITE_SUPABASE_PROJECT_ID` | browser | Same project reference id. |

Anything prefixed with `VITE_` is inlined into the client bundle — never put a secret behind that prefix.

### Server-only secrets (never in a committed file)

These are injected by the hosting platform's secret store and are read only inside server functions / server routes:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access — bypasses RLS. |
| `LOVABLE_API_KEY` | AI gateway calls (NeighbourBot, translation, challenge questions). |
| `ADMIN_CODE` | Code users enter on `/admin` to claim admin rights. |

## Security notes

- Never commit real secret values; add new env files to `.gitignore` first.
- Rotate any key that has ever been committed, pasted in chat, or shared in a screenshot.
- Publishable/anon keys are designed to be public — protect data with Row Level Security instead.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
