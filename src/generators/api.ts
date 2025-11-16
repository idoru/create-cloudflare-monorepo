import path from 'path';
import pc from 'picocolors';
import fs from 'fs-extra';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { exec, execCommand } from '../utils/exec.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';

export async function generateApiApp(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n⚡ Creating API app (Hono)...'));

  const { targetDir, projectName, useTypeScript, packageManager } = config;
  const apiDir = path.join(targetDir, 'api');

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create Hono app using create-hono
  console.log(pc.dim('  Running create-hono...'));
  const createCommand = packageManager === 'npm' ? 'npm create' : `${packageManager} create`;
  await execCommand(
    `${createCommand} hono@latest --template cloudflare-workers --pm ${packageManager} --install api`,
    { cwd: targetDir, stdio: 'inherit' }
  );

  // Install additional dependencies
  console.log(pc.dim('  Installing dependencies...'));
  await exec(
    packageManager,
    [
      'add',
      'hono',
      '@hono/zod-openapi',
      'zod',
    ],
    { cwd: apiDir, silent: true }
  );

  await exec(
    packageManager,
    [
      'add',
      '-D',
      '@cloudflare/workers-types',
      '@cloudflare/vitest-pool-workers',
      'vitest',
      'wrangler',
    ],
    { cwd: apiDir, silent: true }
  );

  // Create src/index.ts with OpenAPI routes
  const indexContent = await readTemplate('api/index.ts.template');
  await writeFile(
    path.join(apiDir, 'src', 'index.ts'),
    replaceVariables(indexContent, variables)
  );

  // Create wrangler.toml
  const wranglerContent = await readTemplate('api/wrangler.toml.template');
  await writeFile(
    path.join(apiDir, 'wrangler.toml'),
    replaceVariables(wranglerContent, variables)
  );

  // Create vitest.config.ts
  const vitestContent = await readTemplate('api/vitest.config.ts.template');
  await writeFile(
    path.join(apiDir, 'vitest.config.ts'),
    replaceVariables(vitestContent, variables)
  );

  // Create test file
  const testContent = await readTemplate('api/index.test.ts.template');
  await writeFile(
    path.join(apiDir, 'src', 'index.test.ts'),
    replaceVariables(testContent, variables)
  );

  // Create scripts directory and generate-openapi.js
  await ensureDir(path.join(apiDir, 'scripts'));
  const openApiContent = await readTemplate('api/generate-openapi.js.template');
  await writeFile(
    path.join(apiDir, 'scripts', 'generate-openapi.js'),
    replaceVariables(openApiContent, variables)
  );

  // Create README
  const readmeContent = await readTemplate('api/README.md.template');
  await writeFile(
    path.join(apiDir, 'README.md'),
    replaceVariables(readmeContent, variables)
  );

  // Update package.json scripts
  const packageJsonPath = path.join(apiDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts = {
    dev: 'wrangler dev',
    deploy: 'wrangler deploy',
    test: 'vitest',
    apidocs: 'node scripts/generate-openapi.js',
  };
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  console.log(pc.green('  ✓ API app created'));
}
