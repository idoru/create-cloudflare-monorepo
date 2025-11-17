# Development Guide

## Building the Initializer

The initializer has been successfully set up and built. Here's how to work with it:

### Build

```bash
npm run build
```

This compiles the TypeScript files from `src/` to `dist/`.

### Development Mode

Watch for changes and rebuild automatically:

```bash
npm run dev
```

## Testing the Initializer Locally

### Option 1: Using npm link (Recommended for Development)

1. Link the package globally:

```bash
npm link
```

2. Create a test project:

```bash
cd /tmp
@idoru/create-cloudflare-monorepo test-project
```

3. Follow the prompts:
   - Project name: test-project
   - Use TypeScript: Yes
   - Package manager: pnpm

4. After creation, verify the structure:

```bash
cd test-project
tree -L 2
```

5. Set up Cloudflare bindings (placeholders are in wrangler.jsonc):

```bash
cd api
npx wrangler d1 create test-project-db
npx wrangler kv:namespace create test-project-kv
# Update api/wrangler.jsonc with the IDs
```

6. Start development servers:

```bash
cd ..
npm run dev
```

7. Test the application:
   - Open http://localhost:5173
   - Click "Send GET Request" - should see `{"hello": "world"}`
   - Enter a message and click "Send POST Request" - should see the message echoed back

8. Run tests:

```bash
npm test
```

9. When done testing, unlink:

```bash
npm unlink -g @idoru/create-cloudflare-monorepo
```

### Option 2: Direct Execution

Run the initializer directly without linking:

```bash
node dist/index.js my-test-project
```

### Option 3: Using npm pack

Create a tarball and install it:

```bash
# In the create-cloudflare-monorepo directory
npm pack

# This creates idoru-create-cloudflare-monorepo-0.1.0.tgz
# Install it globally
npm install -g ./idoru-create-cloudflare-monorepo-0.1.0.tgz

# Now you can use it
@idoru/create-cloudflare-monorepo test-project
```

## Project Structure

```
create-cloudflare-monorepo/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── cli.ts                # Interactive prompts
│   ├── types.ts              # TypeScript interfaces
│   ├── generators/           # Workspace generators
│   │   ├── root.ts
│   │   ├── web.ts
│   │   ├── api.ts
│   │   ├── tests.ts
│   │   └── scripts.ts
│   └── utils/                # Utility functions
│       ├── exec.ts
│       ├── files.ts
│       └── git.ts
├── templates/                # Template files
│   ├── root/
│   ├── web/
│   ├── api/
│   ├── tests/
│   └── scripts/
├── dist/                     # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Modifying Templates

All template files are in the `templates/` directory. They use `{{VARIABLE}}` syntax for replacements.

Available template variables:
- `{{PROJECT_NAME}}` - User's project name
- `{{USE_TYPESCRIPT}}` - true/false
- `{{PACKAGE_MANAGER}}` - npm/pnpm/yarn
- `{{USE_PNPM}}` - true/false
- `{{USE_NPM}}` - true/false
- `{{USE_YARN}}` - true/false

After modifying templates, rebuild:

```bash
npm run build
```

## Adding New Features

### Adding a New Generator

1. Create a new file in `src/generators/`
2. Export an async function that takes `ProjectConfig`
3. Call it from `src/index.ts` in the appropriate order

### Adding New Dependencies to Generated Projects

Update the generator files:
- `src/generators/root.ts` - Root dependencies
- `src/generators/web.ts` - Web app dependencies
- `src/generators/api.ts` - API dependencies
- `src/generators/tests.ts` - Test dependencies
- `src/generators/scripts.ts` - Scripts dependencies

### Adding New Templates

1. Create template file in `templates/`
2. Use `{{VARIABLE}}` for dynamic content
3. Load it in the generator using `readTemplate()`
4. Write it using `writeFile()` with `replaceVariables()`

## Troubleshooting

### Build Errors

Clear dist and rebuild:

```bash
rm -rf dist
npm run build
```

### Template Not Found

Ensure the template path is relative to `templates/` directory:

```typescript
const content = await readTemplate('root/.gitignore.template');
// NOT: 'templates/root/.gitignore.template'
```

### ESM Import Issues

Ensure all imports use `.js` extension:

```typescript
import { exec } from './exec.js';  // Correct
import { exec } from './exec';     // Wrong in ESM
```

## Publishing (For Future)

When ready to publish to npm:

1. Update version in `package.json`
2. Build the project:

```bash
npm run build
```

3. Test one more time locally
4. Publish:

```bash
npm publish
```

5. Users can then use it:

```bash
npm create @idoru/cloudflare-monorepo@latest my-project
```

## CI/CD Recommendations

For automated testing, consider:

1. **GitHub Actions** - Test on multiple Node versions
2. **Integration Tests** - Create a project and verify structure
3. **E2E Tests** - Generate project, install, build, and run tests

Example GitHub Actions workflow:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm install
      - run: npm run build
      - run: npm link
      - run: |
          cd /tmp
          @idoru/create-cloudflare-monorepo test-project <<EOF
          test-project
          y
          pnpm
          EOF
      - run: |
          cd /tmp/test-project
          tree -L 2
```

## Questions?

Check the main README.md for usage instructions and the generated project documentation.
