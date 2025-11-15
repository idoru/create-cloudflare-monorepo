# create-cloudflare-monorepo

An opinionated monorepo initializer for applications deployed to Cloudflare. Scaffolds a complete full-stack project with SvelteKit, Hono, and comprehensive tooling.

## Features

✨ **Modern Tech Stack**
- **Frontend**: SvelteKit + TailwindCSS + Shadcn-svelte
- **Backend**: Hono + @hono/zod-openapi + Zod
- **Testing**: Playwright (E2E) + Vitest (unit)
- **Deployment**: Cloudflare Pages & Workers

🎯 **Batteries Included**
- OpenAPI documentation generation
- ESLint + Prettier configured
- Git hooks with Husky + lint-staged
- D1 and KV bindings ready
- Full TypeScript support
- Workspace-based monorepo

🚀 **Developer Experience**
- Single command to start both frontend and backend
- Vite proxy for seamless API integration
- Hot module replacement everywhere
- Comprehensive README docs for each workspace

## Usage

### Create a New Project

```bash
npm create cloudflare-monorepo@latest my-project
```

Or with other package managers:

```bash
pnpm create cloudflare-monorepo@latest my-project
yarn create cloudflare-monorepo my-project
```

### Interactive Setup

The initializer will prompt you for:

1. **Project name** - Your project's name (lowercase, alphanumeric, hyphens, underscores)
2. **TypeScript** - Use TypeScript or JavaScript
3. **Package manager** - pnpm (recommended), npm, or yarn

### Generated Structure

```
my-project/
├── web/                    # SvelteKit frontend (Cloudflare Pages)
│   ├── src/
│   │   ├── routes/
│   │   │   └── +page.svelte  # Demo page with API integration
│   │   ├── lib/
│   │   │   └── components/   # Shadcn UI components
│   │   └── app.d.ts          # Cloudflare types
│   ├── vite.config.ts        # Vite config with API proxy
│   └── svelte.config.js      # Cloudflare adapter
│
├── api/                    # Hono backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts          # OpenAPI routes
│   │   └── index.test.ts     # Unit tests
│   ├── wrangler.toml         # Cloudflare config (D1 + KV)
│   └── scripts/
│       └── generate-openapi.js
│
├── tests/                  # Playwright E2E tests
│   ├── e2e/
│   │   └── echo.spec.ts      # Sample E2E test
│   └── playwright.config.ts
│
├── scripts/                # Deployment scripts
│   ├── deploy-all.js
│   └── setup-cloudflare.js
│
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # Workspace definition (if using pnpm)
├── eslint.config.js        # Shared ESLint config
├── .prettierrc             # Shared Prettier config
└── README.md               # Project documentation
```

## Getting Started (After Creation)

### 1. Set Up Cloudflare Bindings

#### Create D1 Database

```bash
cd api
npx wrangler d1 create my-project-db
```

Copy the `database_id` and update `api/wrangler.toml`.

#### Create KV Namespace

```bash
npx wrangler kv:namespace create my-project-kv
```

Copy the namespace `id` and update `api/wrangler.toml`.

### 2. Start Development

```bash
cd my-project
npm run dev
```

This starts:
- Web app on http://localhost:5173
- API on http://localhost:8787

The Vite dev server proxies `/api/*` requests to the Hono backend.

### 3. Run Tests

```bash
# E2E tests
npm test

# Unit tests
npm run test:unit

# UI mode (interactive)
npm run test:ui
```

## Available Commands

```bash
# Development
npm run dev          # Start both web and API dev servers
npm run build        # Build all workspaces
npm run preview      # Preview production build

# Testing
npm test             # Run E2E tests
npm run test:unit    # Run API unit tests
npm run test:ui      # Run tests in UI mode

# Code Quality
npm run lint         # Lint all code
npm run format       # Format all code

# Documentation
npm run apidocs      # Generate OpenAPI specification

# Deployment
npm run deploy:web   # Deploy web app to Cloudflare Pages
npm run deploy:api   # Deploy API to Cloudflare Workers
```

## Tech Stack Details

### Frontend (`web/`)

- **SvelteKit 5** - Full-stack framework with SSR
- **@sveltejs/adapter-cloudflare** - Deploy to Cloudflare Pages
- **TailwindCSS 3** - Utility-first CSS
- **Shadcn-svelte** - Beautiful, accessible UI components
- **Vite 5** - Fast build tool with HMR

### Backend (`api/`)

- **Hono 4** - Lightweight, fast web framework
- **@hono/zod-openapi** - OpenAPI 3.1 schema generation
- **Zod 3** - TypeScript-first schema validation
- **Vitest** - Fast unit testing
- **Wrangler 3** - Cloudflare CLI tool
- **D1** - SQL database (SQLite on edge)
- **KV** - Key-value store

### Testing (`tests/`)

- **Playwright 1.x** - Modern E2E testing
- **Multi-browser support** - Chromium, Firefox, WebKit
- **Auto-server startup** - Starts web and API automatically

### Development Tools

- **TypeScript 5.7** - Type safety
- **ESLint 9** - Code linting (flat config)
- **Prettier 3** - Code formatting
- **Husky 9** - Git hooks
- **lint-staged** - Pre-commit linting
- **concurrently** - Run multiple commands

## Development Workflow

### Adding a New API Endpoint

1. Define your route in `api/src/index.ts`:

```typescript
const myRoute = createRoute({
  method: 'get',
  path: '/api/myroute',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'Success',
    },
  },
});

app.openapi(myRoute, (c) => {
  return c.json({ message: 'Hello!' });
});
```

2. The endpoint automatically appears in OpenAPI docs:

```bash
npm run apidocs
```

3. Use it in your SvelteKit app:

```svelte
<script lang="ts">
  async function fetchData() {
    const res = await fetch('/api/myroute');
    const data = await res.json();
    console.log(data.message);
  }
</script>
```

### Adding UI Components

Add Shadcn components:

```bash
cd web
npx shadcn-svelte@latest add dialog
```

Use in your pages:

```svelte
<script>
  import { Dialog } from '$lib/components/ui/dialog';
</script>
```

### Using D1 Database

```typescript
app.get('/api/users', async (c) => {
  const result = await c.env.D1.prepare('SELECT * FROM users').all();
  return c.json(result);
});
```

### Using KV Store

```typescript
app.get('/api/cache/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.KV.get(key);
  return c.json({ key, value });
});
```

## Deployment

### Web App (Cloudflare Pages)

#### Via Git Integration (Recommended)

1. Push your repo to GitHub/GitLab
2. Connect to Cloudflare Pages
3. Set:
   - Build command: `npm run build --workspace web`
   - Build output: `web/.svelte-kit/cloudflare`

#### Manual Deployment

```bash
cd web
npm run build
npm run deploy
```

### API (Cloudflare Workers)

```bash
cd api
npm run deploy
```

Or deploy everything:

```bash
node scripts/deploy-all.js
```

## Environment Variables

### Development

Create `.dev.vars` in the `api/` directory:

```env
MY_SECRET=my-dev-secret
```

### Production

Use Wrangler to set secrets:

```bash
cd api
npx wrangler secret put MY_SECRET
```

## Troubleshooting

### Port Already in Use

Change ports in:
- `web/vite.config.ts` - Web app port
- `api/wrangler.toml` - API port (under `[dev]`)

### Git Hooks Not Running

Reinstall Husky:

```bash
npm run prepare
```

### Playwright Browsers Missing

Install browsers:

```bash
cd tests
npx playwright install
```

### Build Errors

Clear build caches:

```bash
rm -rf web/.svelte-kit api/.wrangler tests/test-results
npm run build
```

## Contributing to This Initializer

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/create-cloudflare-monorepo.git
cd create-cloudflare-monorepo
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Test locally:

```bash
npm link
cd /tmp
create-cloudflare-monorepo test-project
```

### Project Structure

```
src/
├── index.ts           # Main CLI entry point
├── cli.ts             # Interactive prompts
├── types.ts           # TypeScript types
├── generators/        # Workspace generators
│   ├── root.ts       # Root workspace
│   ├── web.ts        # SvelteKit app
│   ├── api.ts        # Hono app
│   ├── tests.ts      # Playwright tests
│   └── scripts.ts    # Utility scripts
├── utils/            # Helper functions
│   ├── exec.ts       # Command execution
│   ├── files.ts      # File operations
│   └── git.ts        # Git operations
└── templates/        # Template files
    ├── root/
    ├── web/
    ├── api/
    ├── tests/
    └── scripts/
```

## License

MIT

## Learn More

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [SvelteKit](https://kit.svelte.dev/)
- [Hono](https://hono.dev/)
- [Shadcn-svelte](https://www.shadcn-svelte.com/)
- [Playwright](https://playwright.dev/)

## Credits

Created with ❤️ for the Cloudflare developer community.
