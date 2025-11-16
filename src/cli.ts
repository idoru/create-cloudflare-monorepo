import prompts from 'prompts';
import path from 'path';
import pc from 'picocolors';
import type { ProjectConfig } from './types.js';
import { pathExists, isEmpty } from './utils/files.js';

export async function getProjectConfig(projectNameArg?: string): Promise<ProjectConfig> {
  // Welcome message
  console.log(pc.bold(pc.blue('\ncreate-cloudflare-monorepo\n')));
  console.log(pc.dim('An opinionated monorepo initializer for Cloudflare-deployed applications\n'));

  const questions: prompts.PromptObject[] = [];

  // Project name
  if (!projectNameArg) {
    questions.push({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-cloudflare-app',
      validate: (value: string) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/.test(value)) {
          return 'Project name can only contain lowercase letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    });
  }

  // TypeScript
  questions.push({
    type: 'confirm',
    name: 'useTypeScript',
    message: 'Use TypeScript?',
    initial: true,
  });

  // Package manager
  questions.push({
    type: 'select',
    name: 'packageManager',
    message: 'Select package manager:',
    choices: [
      { title: 'pnpm (recommended)', value: 'pnpm' },
      { title: 'npm', value: 'npm' },
      { title: 'yarn', value: 'yarn' },
    ],
    initial: 0,
  });

  // Shadcn base color
  questions.push({
    type: 'select',
    name: 'shadcnBaseColor',
    message: 'Select UI base color:',
    choices: [
      { title: 'Neutral', value: 'neutral' },
      { title: 'Slate', value: 'slate' },
      { title: 'Gray', value: 'gray' },
      { title: 'Zinc', value: 'zinc' },
      { title: 'Stone', value: 'stone' },
    ],
    initial: 0,
  });

  const answers = await prompts(questions, {
    onCancel: () => {
      console.log(pc.red('\n✖ Cancelled'));
      process.exit(0);
    },
  });

  const projectName = projectNameArg || answers.projectName;
  const targetDir = path.resolve(process.cwd(), projectName);

  // Check if directory already exists
  if (await pathExists(targetDir)) {
    const isEmptyDir = await isEmpty(targetDir);
    if (!isEmptyDir) {
      const { overwrite } = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${projectName}" already exists and is not empty. Overwrite?`,
        initial: false,
      });

      if (!overwrite) {
        console.log(pc.red('\n✖ Cancelled'));
        process.exit(0);
      }
    }
  }

  return {
    projectName,
    targetDir,
    useTypeScript: answers.useTypeScript,
    packageManager: answers.packageManager,
    shadcnBaseColor: answers.shadcnBaseColor,
  };
}
