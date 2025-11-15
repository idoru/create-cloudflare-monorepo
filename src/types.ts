export interface ProjectConfig {
  projectName: string;
  targetDir: string;
  useTypeScript: boolean;
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

export interface TemplateVariables extends Record<string, string | boolean> {
  PROJECT_NAME: string;
  USE_TYPESCRIPT: boolean;
  PACKAGE_MANAGER: string;
  USE_PNPM: boolean;
  USE_NPM: boolean;
  USE_YARN: boolean;
}
