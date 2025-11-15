import path from 'path';
import pc from 'picocolors';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';

export async function generateRootWorkspace(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n📦 Creating root workspace...'));

  const { targetDir, projectName, useTypeScript, packageManager } = config;

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create root package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    type: 'module',
    ...(packageManager === 'pnpm'
      ? {}
      : { workspaces: ['web', 'api', 'scripts', 'tests'] }),
    scripts: {
      dev: 'concurrently -n web,api "npm --workspace web run dev" "npm --workspace api run dev"',
      build: 'npm run build --workspaces --if-present',
      preview: 'npm --workspace web run preview',
      test: 'npm --workspace tests run test',
      'test:unit': 'npm --workspace api run test',
      'test:ui': 'npm --workspace tests run test:ui',
      lint: 'eslint .',
      format: 'prettier --write .',
      apidocs: 'npm --workspace api run apidocs',
      'deploy:web': 'npm --workspace web run deploy',
      'deploy:api': 'npm --workspace api run deploy',
      prepare: 'husky',
    },
    devDependencies: {
      '@eslint/js': '^9.17.0',
      'eslint': '^9.17.0',
      'eslint-plugin-svelte': '^2.46.1',
      'typescript-eslint': '^8.18.2',
      'globals': '^15.13.0',
      'prettier': '^3.4.2',
      'prettier-plugin-svelte': '^3.3.2',
      'typescript': '^5.7.2',
      'concurrently': '^9.1.2',
      'husky': '^9.1.7',
      'lint-staged': '^15.2.11',
      'picocolors': '^1.1.1',
    },
    'lint-staged': {
      '*.{js,ts,svelte}': ['eslint --fix', 'prettier --write'],
      '*.{json,md}': ['prettier --write'],
    },
  };

  await writeFile(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create pnpm-workspace.yaml if using pnpm
  if (packageManager === 'pnpm') {
    const workspaceContent = await readTemplate('root/pnpm-workspace.yaml.template');
    await writeFile(
      path.join(targetDir, 'pnpm-workspace.yaml'),
      replaceVariables(workspaceContent, variables)
    );
  }

  // Create .gitignore
  const gitignoreContent = await readTemplate('root/.gitignore.template');
  await writeFile(
    path.join(targetDir, '.gitignore'),
    replaceVariables(gitignoreContent, variables)
  );

  // Create .prettierrc
  const prettierContent = await readTemplate('root/.prettierrc.template');
  await writeFile(
    path.join(targetDir, '.prettierrc'),
    replaceVariables(prettierContent, variables)
  );

  // Create eslint.config.js
  const eslintContent = await readTemplate('root/eslint.config.js.template');
  await writeFile(
    path.join(targetDir, 'eslint.config.js'),
    replaceVariables(eslintContent, variables)
  );

  // Create README.md
  const readmeContent = await readTemplate('root/README.md.template');
  await writeFile(
    path.join(targetDir, 'README.md'),
    replaceVariables(readmeContent, variables)
  );

  console.log(pc.green('  ✓ Root workspace created'));
}
