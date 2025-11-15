import path from 'path';
import pc from 'picocolors';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';
import fs from 'fs-extra';

export async function generateScriptsWorkspace(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n📜 Creating scripts workspace...'));

  const { targetDir, projectName, packageManager } = config;
  const scriptsDir = path.join(targetDir, 'scripts');

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: config.useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create scripts directory
  await ensureDir(scriptsDir);

  // Create package.json
  const packageJson = {
    name: 'scripts',
    version: '0.0.1',
    private: true,
    type: 'module',
    dependencies: {
      'picocolors': '^1.1.1',
    },
  };

  await writeFile(
    path.join(scriptsDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create deploy-all.js
  const deployContent = await readTemplate('scripts/deploy-all.js.template');
  const deployScript = replaceVariables(deployContent, variables);
  await writeFile(path.join(scriptsDir, 'deploy-all.js'), deployScript);
  await fs.chmod(path.join(scriptsDir, 'deploy-all.js'), '755');

  // Create setup-cloudflare.js
  const setupContent = await readTemplate('scripts/setup-cloudflare.js.template');
  const setupScript = replaceVariables(setupContent, variables);
  await writeFile(path.join(scriptsDir, 'setup-cloudflare.js'), setupScript);
  await fs.chmod(path.join(scriptsDir, 'setup-cloudflare.js'), '755');

  // Create README
  const readmeContent = await readTemplate('scripts/README.md.template');
  await writeFile(
    path.join(scriptsDir, 'README.md'),
    replaceVariables(readmeContent, variables)
  );

  console.log(pc.green('  ✓ Scripts workspace created'));
}
