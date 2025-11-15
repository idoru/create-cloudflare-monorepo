import { exec } from './exec.js';
import { pathExists } from './files.js';
import path from 'path';

export async function isGitInstalled(): Promise<boolean> {
  try {
    await exec('git', ['--version'], { silent: true });
    return true;
  } catch {
    return false;
  }
}

export async function isGitRepository(dirPath: string): Promise<boolean> {
  const gitPath = path.join(dirPath, '.git');
  return await pathExists(gitPath);
}

export async function initGitRepository(dirPath: string): Promise<void> {
  if (await isGitRepository(dirPath)) {
    return;
  }

  await exec('git', ['init'], { cwd: dirPath });
}

export async function createInitialCommit(dirPath: string, message: string = 'Initial commit'): Promise<void> {
  await exec('git', ['add', '.'], { cwd: dirPath });
  await exec('git', ['commit', '-m', message], { cwd: dirPath });
}
