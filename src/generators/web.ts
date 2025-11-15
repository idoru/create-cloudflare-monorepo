import path from 'path';
import pc from 'picocolors';
import type { ProjectConfig, TemplateVariables } from '../types.js';
import { exec, execCommand } from '../utils/exec.js';
import { ensureDir, writeFile, readTemplate, replaceVariables } from '../utils/files.js';

export async function generateWebApp(config: ProjectConfig): Promise<void> {
  console.log(pc.cyan('\n🌐 Creating web app (SvelteKit)...'));

  const { targetDir, projectName, useTypeScript, packageManager } = config;
  const webDir = path.join(targetDir, 'web');

  const variables: TemplateVariables = {
    PROJECT_NAME: projectName,
    USE_TYPESCRIPT: useTypeScript,
    PACKAGE_MANAGER: packageManager,
    USE_PNPM: packageManager === 'pnpm',
    USE_NPM: packageManager === 'npm',
    USE_YARN: packageManager === 'yarn',
  };

  // Create SvelteKit app using create-svelte
  console.log(pc.dim('  Running create-svelte...'));
  const createCommand = packageManager === 'npm' ? 'npm create' : `${packageManager} create`;
  await execCommand(
    `${createCommand} svelte@latest web -- --template skeleton ${useTypeScript ? '--types ts' : '--types checkjs'} --no-eslint --no-prettier --no-playwright --no-vitest`,
    { cwd: targetDir, silent: true }
  );

  // Install Cloudflare adapter
  console.log(pc.dim('  Installing Cloudflare adapter...'));
  await exec(packageManager, ['add', '-D', '@sveltejs/adapter-cloudflare'], {
    cwd: webDir,
    silent: true,
  });

  // Update svelte.config.js to use Cloudflare adapter
  const svelteConfig = `import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
    }),
  },
};

export default config;
`;

  await writeFile(path.join(webDir, 'svelte.config.js'), svelteConfig);

  // Add TailwindCSS
  console.log(pc.dim('  Adding TailwindCSS...'));
  await execCommand(`npx sv add tailwindcss --no-precss --typography false`, {
    cwd: webDir,
    stdio: 'inherit',
  });

  // Initialize shadcn-svelte
  console.log(pc.dim('  Initializing shadcn-svelte...'));
  await execCommand(`npx shadcn-svelte@latest init -y`, {
    cwd: webDir,
    stdio: 'inherit',
  });

  // Add shadcn components
  console.log(pc.dim('  Adding UI components...'));
  await execCommand(`npx shadcn-svelte@latest add -y button card input label`, {
    cwd: webDir,
    stdio: 'inherit',
  });

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

  // Install @cloudflare/workers-types
  console.log(pc.dim('  Installing Cloudflare types...'));
  await exec(packageManager, ['add', '-D', '@cloudflare/workers-types'], {
    cwd: webDir,
    silent: true,
  });

  // Add deploy script to package.json
  const packageJsonPath = path.join(webDir, 'package.json');
  const fs = await import('fs-extra');
  const packageJson = await fs.readJson(packageJsonPath);
  packageJson.scripts.deploy = 'wrangler pages deploy .svelte-kit/cloudflare';
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  console.log(pc.green('  ✓ Web app created'));
}
