import { execa } from 'execa';
import pc from 'picocolors';

export interface ExecOptions {
  cwd?: string;
  silent?: boolean;
  stdio?: 'inherit' | 'pipe';
}

export async function exec(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  const { cwd = process.cwd(), silent = false, stdio = 'pipe' } = options;

  if (!silent) {
    console.log(pc.dim(`$ ${command} ${args.join(' ')}`));
  }

  try {
    const result = await execa(command, args, {
      cwd,
      stdio: stdio === 'inherit' ? 'inherit' : 'pipe',
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
    };
  } catch (error: any) {
    if (!silent) {
      console.error(pc.red(`Error executing: ${command} ${args.join(' ')}`));
      if (error.stderr) console.error(pc.red(error.stderr));
    }
    throw error;
  }
}

export async function execCommand(
  command: string,
  options: ExecOptions = {}
): Promise<{ stdout: string; stderr: string }> {
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1);
  return exec(cmd, args, options);
}

export function getPackageManagerCommand(pm: 'npm' | 'pnpm' | 'yarn'): {
  install: string;
  run: (script: string) => string;
  exec: (command: string) => string;
} {
  switch (pm) {
    case 'pnpm':
      return {
        install: 'pnpm install',
        run: (script) => `pnpm run ${script}`,
        exec: (command) => `pnpm ${command}`,
      };
    case 'yarn':
      return {
        install: 'yarn install',
        run: (script) => `yarn ${script}`,
        exec: (command) => `yarn ${command}`,
      };
    case 'npm':
    default:
      return {
        install: 'npm install',
        run: (script) => `npm run ${script}`,
        exec: (command) => `npx ${command}`,
      };
  }
}
