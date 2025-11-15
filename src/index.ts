#!/usr/bin/env node

import pc from 'picocolors';
import { getProjectConfig } from './cli.js';
import { generateRootWorkspace } from './generators/root.js';
import { generateWebApp } from './generators/web.js';
import { generateApiApp } from './generators/api.js';
import { generateTestsWorkspace } from './generators/tests.js';
import { generateScriptsWorkspace } from './generators/scripts.js';
import { initGitRepository, isGitInstalled } from './utils/git.js';
import { ensureDir } from './utils/files.js';
import { exec, getPackageManagerCommand } from './utils/exec.js';

async function main() {
  try {
    // Get project configuration from user
    const projectNameArg = process.argv[2];
    const config = await getProjectConfig(projectNameArg);

    const startTime = Date.now();

    console.log(pc.cyan(`\n🚀 Creating ${config.projectName}...`));

    // Create target directory
    await ensureDir(config.targetDir);

    // Generate all workspaces
    await generateRootWorkspace(config);
    await generateWebApp(config);
    await generateApiApp(config);
    await generateTestsWorkspace(config);
    await generateScriptsWorkspace(config);

    // Initialize git repository
    const gitInstalled = await isGitInstalled();
    if (gitInstalled) {
      console.log(pc.cyan('\n📦 Initializing git repository...'));
      await initGitRepository(config.targetDir);
      console.log(pc.green('  ✓ Git repository initialized'));
    } else {
      console.log(pc.yellow('\n⚠ Git not found, skipping git initialization'));
    }

    // Install dependencies
    console.log(pc.cyan('\n📦 Installing dependencies...'));
    console.log(pc.dim('  This may take a few minutes...\n'));

    const pmCommand = getPackageManagerCommand(config.packageManager);
    await exec(
      config.packageManager,
      ['install'],
      { cwd: config.targetDir, stdio: 'inherit' }
    );

    // Initialize husky
    if (gitInstalled) {
      console.log(pc.cyan('\n🐕 Setting up Husky...'));
      try {
        await exec(
          config.packageManager,
          config.packageManager === 'npm' ? ['run', 'prepare'] : ['prepare'],
          { cwd: config.targetDir, silent: true }
        );
        console.log(pc.green('  ✓ Husky configured'));
      } catch (error) {
        console.log(pc.yellow('  ⚠ Could not initialize Husky (this is optional)'));
      }
    }

    // Calculate elapsed time
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Success message
    console.log(pc.bold(pc.green(`\n✅ Success! Created ${config.projectName} in ${elapsed}s\n`)));

    // Next steps
    console.log(pc.bold('Next steps:\n'));
    console.log(pc.cyan('  1. ') + `cd ${config.projectName}`);
    console.log(pc.cyan('  2. ') + 'Set up Cloudflare bindings:');
    console.log(pc.dim('     • Create D1 database: ') + pc.yellow('cd api && npx wrangler d1 create <name>-db'));
    console.log(pc.dim('     • Create KV namespace: ') + pc.yellow('npx wrangler kv:namespace create <name>-kv'));
    console.log(pc.dim('     • Update api/wrangler.toml with the IDs'));
    console.log(pc.cyan('  3. ') + `${pmCommand.run('dev')}`);

    console.log(pc.bold('\nAvailable commands:\n'));
    console.log(pc.dim('  Development:'));
    console.log(`    ${pmCommand.run('dev')}          ${pc.dim('Start dev servers')}`);
    console.log(`    ${pmCommand.run('build')}        ${pc.dim('Build all apps')}`);
    console.log(pc.dim('\n  Testing:'));
    console.log(`    ${pmCommand.run('test')}         ${pc.dim('Run E2E tests')}`);
    console.log(`    ${pmCommand.run('test:unit')}    ${pc.dim('Run API unit tests')}`);
    console.log(pc.dim('\n  Code Quality:'));
    console.log(`    ${pmCommand.run('lint')}         ${pc.dim('Lint code')}`);
    console.log(`    ${pmCommand.run('format')}       ${pc.dim('Format code')}`);
    console.log(pc.dim('\n  Documentation:'));
    console.log(`    ${pmCommand.run('apidocs')}      ${pc.dim('Generate OpenAPI spec')}`);
    console.log(pc.dim('\n  Deployment:'));
    console.log(`    ${pmCommand.run('deploy:web')}   ${pc.dim('Deploy web to Pages')}`);
    console.log(`    ${pmCommand.run('deploy:api')}   ${pc.dim('Deploy API to Workers')}`);

    console.log(pc.bold('\nDocumentation:\n'));
    console.log(`  ${pc.dim('Root:')}    README.md`);
    console.log(`  ${pc.dim('Web:')}     web/README.md`);
    console.log(`  ${pc.dim('API:')}     api/README.md`);
    console.log(`  ${pc.dim('Tests:')}   tests/README.md`);
    console.log(`  ${pc.dim('Scripts:')} scripts/README.md`);

    console.log(pc.dim('\nHappy coding! 🎉\n'));
  } catch (error: any) {
    console.error(pc.bold(pc.red('\n✖ Error:')), error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(pc.dim(error.stack));
    }
    process.exit(1);
  }
}

main();
