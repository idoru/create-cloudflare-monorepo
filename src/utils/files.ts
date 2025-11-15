import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function copyTemplate(templateName: string, targetPath: string): Promise<void> {
  const templatePath = path.join(__dirname, '../../templates', templateName);
  await fs.copy(templatePath, targetPath);
}

export async function readTemplate(templatePath: string): Promise<string> {
  const fullPath = path.join(__dirname, '../../templates', templatePath);
  return await fs.readFile(fullPath, 'utf-8');
}

export function replaceVariables(content: string, variables: Record<string, string | boolean>): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

export async function pathExists(pathToCheck: string): Promise<boolean> {
  try {
    await fs.access(pathToCheck);
    return true;
  } catch {
    return false;
  }
}

export async function isEmpty(dirPath: string): Promise<boolean> {
  const files = await fs.readdir(dirPath);
  return files.length === 0;
}
