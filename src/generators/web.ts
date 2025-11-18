import path from 'path';
import pc from 'picocolors';
import fs from 'fs-extra';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { exec, execCommand } from '../utils/exec.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';

export async function generateWebApp(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n🌐 Creating web app (SvelteKit)...'));

  const { targetDir, projectName, useTypeScript, packageManager, shadcnBaseColor } = config;
  const webDir = path.join(targetDir, 'web');

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create SvelteKit app using sv create
  console.log(pc.dim('  Running sv create...'));
  await execCommand(
    `npx sv create web --template minimal --install ${packageManager} ${useTypeScript ? '--types ts' : '--types jsdoc'} --no-add-ons`,
    { cwd: targetDir, stdio: 'inherit' }
  );

  // Add Cloudflare adapter and TailwindCSS with plugins using sv add
  console.log(pc.dim('  Adding Cloudflare adapter and TailwindCSS...'));
  await execCommand(
    `npx sv add --install ${packageManager} sveltekit-adapter=adapter:cloudflare tailwindcss=plugins:typography,forms`,
    { cwd: webDir, stdio: 'inherit' }
  );

  // Initialize shadcn-svelte with flags to avoid interactive prompts
  console.log(pc.dim('  Initializing shadcn-svelte...'));
  await execCommand(
    `npx shadcn-svelte@latest init --base-color ${shadcnBaseColor} --css src/routes/layout.css --lib-alias $lib --components-alias $lib/components --ui-alias $lib/components/ui --utils-alias $lib/utils --hooks-alias $lib/hooks`,
    {
      cwd: webDir,
      stdio: 'inherit',
    }
  );

  // Add shadcn components (must be added individually with -y flag)
  console.log(pc.dim('  Adding UI components...'));
  await execCommand(`npx shadcn-svelte@latest add button -y`, {
    cwd: webDir,
    stdio: 'inherit',
  });
  await execCommand(`npx shadcn-svelte@latest add card -y`, {
    cwd: webDir,
    stdio: 'inherit',
  });
  await execCommand(`npx shadcn-svelte@latest add input -y`, {
    cwd: webDir,
    stdio: 'inherit',
  });
  await execCommand(`npx shadcn-svelte@latest add label -y`, {
    cwd: webDir,
    stdio: 'inherit',
  });

  // Now customize files after all tooling setup is complete
  // Create vite.config.ts with API proxy
  const viteConfigContent = await readTemplate('web/vite.config.ts.template');
  await writeFile(
    path.join(webDir, 'vite.config.ts'),
    replaceVariables(viteConfigContent, variables)
  );

  // Create app.d.ts with Cloudflare types
  const appDtsContent = await readTemplate('web/app.d.ts.template');
  await writeFile(
    path.join(webDir, 'src', 'app.d.ts'),
    replaceVariables(appDtsContent, variables)
  );

  // Create demo +page.svelte
  const pageContent = await readTemplate('web/+page.svelte.template');
  await writeFile(
    path.join(webDir, 'src', 'routes', '+page.svelte'),
    replaceVariables(pageContent, variables)
  );

  // Create README
  const readmeContent = await readTemplate('web/README.md.template');
  await writeFile(
    path.join(webDir, 'README.md'),
    replaceVariables(readmeContent, variables)
  );

  // Install @cloudflare/workers-types and wrangler
  console.log(pc.dim('  Installing Cloudflare types and wrangler...'));
  await exec(packageManager, ['add', '-D', '@cloudflare/workers-types', 'wrangler'], {
    cwd: webDir,
    silent: true,
  });

  // Add deploy script to package.json
  const packageJsonPath = path.join(webDir, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts.deploy = 'wrangler pages deploy .svelte-kit/cloudflare';
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  console.log(pc.green('  ✓ Web app created'));
}
