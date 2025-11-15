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

  // Create playwright.config.ts
  const playwrightConfigContent = await readTemplate('tests/playwright.config.ts.template');
  await writeFile(
    path.join(testsDir, 'playwright.config.ts'),
    replaceVariables(playwrightConfigContent, variables)
  );

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
