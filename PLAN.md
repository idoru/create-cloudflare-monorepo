Create an initializer package named `create-cloudflare-monorepo`, an opinionated repository initializer for apps deployed to Cloudflare.

Provide a README.md at the root including instructions on how to build, install and use this initializer in development should be included.

It's main user entrypoint of the initializer should be:
```
npm create cloudflare-monorepo@latest my-project
```

Details on monorepo initialization requirements:

- It should initialize the current dir as a git repository, if it isn't already. Include sensible .gitignore

- Allow the user to choose whether to use javascript or typescript, and which package manager to use (default to npm).

- It should provide a template for setting local dev settings.

- The monorepo should have the following dirs:
  - `web` is a Cloudflare Pages deployed SvelteKit app (using the cloudflare adapter) with Shadcn + TailwindCSS.
  - `api` is a Cloudflare Workers deployed Hono app with Chanfana + Zod.
  - `scripts` for custom build/deplu scripts
  - `tests` for end-to-end tests (using Playwright)

- The `web` and `api` apps should be created using appropriate initializer packages, for example:
  ```
  npm create svelte@latest web -- --template skeleton --typescript
  npm create hono@latest api -- --template cloudflare-workers --pm npm --install
  ```

- Each app should have its own package.json scripts.

- Add top level package.json scripts as appropriate.

- There should be a root-level README.md as well as specific ones under `web/` and `api/`.

- `package.json` Scripts that must exist: dev, test, apidocs (OpenAPI/Swagger spec generation from Chanfana), lint (use ESLint, Prettier).

- The `api` app should be configured with a D1Database binding named D1, and a KV binding named KV, and code for two scaffold endpoints:
  - `GET /api/echo` which returns a `{ "hello": "world" }` json object.
  - `POST /api/echo` which accepts a json body and returns it back embedded in a `{ "echo": {...} }` json object.

- The `web` app should contain an default index page which exercises Shadcn + TailwindCSS so the setup can be quickly verified. This should include a button which hits the POST /api/echo endpoint and displays the returned value.

- Add basic unit tests for the `api` app.

- Add an end-to-end test which checks the behavior of the UI hooked up to the /epi/echo endpoint.

- Vite should be configured such that the `web` app proxies requests under the path prefix `/api/` to the `api` app when developing on localhost.

Docs on installation various items:

TailwindCSS with SvelteKit: https://tailwindcss.com/docs/installation/framework-guides/sveltekit
shadcn-svelte: https://www.shadcn-svelte.com/docs/installation/sveltekit
