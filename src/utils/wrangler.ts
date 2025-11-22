import pc from 'picocolors';
import { exec } from './exec.js';

const FIXME_SENTINEL = 'FIXME-REPLACE-WITH-ACTUAL-ID';

export interface CloudflareResources {
  kvId: string;
  d1Id: string;
  warnings: string[];
}

/**
 * Get KV namespace ID by name using wrangler kv namespace list
 */
async function getKVNamespaceId(name: string): Promise<string | null> {
  try {
    const { stdout } = await exec('npx', ['wrangler', 'kv', 'namespace', 'list'], { silent: true });
    const namespaces = JSON.parse(stdout);
    const namespace = namespaces.find((ns: any) => ns.title === name);
    return namespace?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get D1 database ID by name using wrangler d1 info
 */
async function getD1DatabaseId(name: string): Promise<string | null> {
  try {
    const { stdout } = await exec('npx', ['wrangler', 'd1', 'info', name, '--json'], { silent: true });
    const info = JSON.parse(stdout);
    return info.uuid || null;
  } catch (error) {
    return null;
  }
}

/**
 * Create KV namespace and return its ID
 */
async function createKVNamespace(name: string): Promise<string | null> {
  console.log(pc.dim(`  Creating KV namespace: ${name}...`));

  try {
    await exec('npx', ['wrangler', 'kv', 'namespace', 'create', name], { silent: true });
    console.log(pc.green(`  ✓ KV namespace created`));

    // Get the ID using list command
    const id = await getKVNamespaceId(name);
    if (id) {
      console.log(pc.dim(`    ID: ${id}`));
      return id;
    } else {
      console.log(pc.yellow(`  ⚠ Could not retrieve KV namespace ID`));
      return null;
    }
  } catch (error: any) {
    console.log(pc.yellow(`  ⚠ Could not create KV namespace: ${error.message}`));
    return null;
  }
}

/**
 * Create D1 database and return its ID
 */
async function createD1Database(name: string): Promise<string | null> {
  console.log(pc.dim(`  Creating D1 database: ${name}...`));

  try {
    await exec('npx', ['wrangler', 'd1', 'create', name], { silent: true });
    console.log(pc.green(`  ✓ D1 database created`));

    // Get the ID using info command
    const id = await getD1DatabaseId(name);
    if (id) {
      console.log(pc.dim(`    ID: ${id}`));
      return id;
    } else {
      console.log(pc.yellow(`  ⚠ Could not retrieve D1 database ID`));
      return null;
    }
  } catch (error: any) {
    console.log(pc.yellow(`  ⚠ Could not create D1 database: ${error.message}`));
    return null;
  }
}

/**
 * Create Cloudflare resources (KV namespace and D1 database)
 * If creation fails, uses FIXME sentinel values and collects warnings
 */
export async function ensureCloudflareResources(projectName: string): Promise<CloudflareResources> {
  const kvName = `${projectName}-kv`;
  const d1Name = `${projectName}-db`;
  const warnings: string[] = [];

  console.log(pc.cyan('\n☁️  Creating Cloudflare resources...'));

  // Try to create KV namespace
  const kvId = await createKVNamespace(kvName);
  if (!kvId) {
    warnings.push(`KV namespace "${kvName}" could not be created. Update the ID in api/wrangler.jsonc manually.`);
  }

  // Try to create D1 database
  const d1Id = await createD1Database(d1Name);
  if (!d1Id) {
    warnings.push(`D1 database "${d1Name}" could not be created. Update the ID in api/wrangler.jsonc manually.`);
  }

  if (warnings.length === 0) {
    console.log(pc.green('\n  ✓ All Cloudflare resources created successfully'));
  }

  return {
    kvId: kvId || FIXME_SENTINEL,
    d1Id: d1Id || FIXME_SENTINEL,
    warnings,
  };
}
