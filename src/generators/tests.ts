import path from 'path';
import pc from 'picocolors';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { exec, execCommand } from '../utils/exec.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';

export async function generateTestsWorkspace(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n🧪 Creating tests workspace (Playwright)...'));

  const { targetDir, projectName, useTypeScript, packageManager } = config;
  const testsDir = path.join(targetDir, 'tests');

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create tests directory
  await ensureDir(testsDir);
  await ensureDir(path.join(testsDir, 'e2e'));

  // Create package.json
  const packageJson = {
    name: 'tests',
    version: '0.0.1',
    private: true,
    type: 'module',
    scripts: {
      test: 'playwright test',
      'test:ui': 'playwright test --ui',
      'test:debug': 'playwright test --debug',
    },
    devDependencies: {
      '@playwright/test': '^1.49.1',
      '@types/node': '^22.10.2',
    },
  };

  await writeFile(
    path.join(testsDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Install Playwright
  console.log(pc.dim('  Installing Playwright...'));
  await exec(packageManager, ['install'], { cwd: testsDir, silent: true });

  // Create playwright.config.ts with package-manager-aware commands
  const getWorkspaceCommand = (workspace: string, script: string) => {
    switch (packageManager) {
      case 'pnpm':
        return `pnpm --filter ${workspace} run ${script}`;
      case 'yarn':
        return `yarn workspace ${workspace} run ${script}`;
      case 'npm':
      default:
        return `npm --workspace ${workspace} run ${script}`;
    }
  };

  const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  // Web server only - API is accessed via Vite proxy at /api/*
  // In development: run both \`pnpm run dev\` (starts web + api)
  // In CI: webServer starts both servers below
  webServer: process.env.CI ? [
    {
      command: '${getWorkspaceCommand('web', 'dev')}',
      url: 'http://localhost:5173',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
    {
      command: '${getWorkspaceCommand('api', 'dev')}',
      url: 'http://localhost:8787/api/echo',
      reuseExistingServer: false,
      timeout: 120 * 1000,
    },
  ] : {
    command: '${getWorkspaceCommand('web', 'dev')}',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
`;

  await writeFile(path.join(testsDir, 'playwright.config.ts'), playwrightConfig);

  // Create E2E test
  const testContent = await readTemplate('tests/echo.spec.ts.template');
  await writeFile(
    path.join(testsDir, 'e2e', 'echo.spec.ts'),
    replaceVariables(testContent, variables)
  );

  // Create README
  const readmeContent = await readTemplate('tests/README.md.template');
  await writeFile(
    path.join(testsDir, 'README.md'),
    replaceVariables(readmeContent, variables)
  );

  // Install Playwright browsers
  console.log(pc.dim('  Installing Playwright browsers...'));
  await execCommand('npx playwright install --with-deps chromium', {
    cwd: testsDir,
    stdio: 'inherit',
  });

  console.log(pc.green('  ✓ Tests workspace created'));
}
