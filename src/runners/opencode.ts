import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { exportToOpenCode } from '../adapters/opencode.js';
import { AgentManifest } from '../utils/loader.js';
import { error, info } from '../utils/format.js';

export interface OpenCodeRunOptions {
  prompt?: string;
}

/**
 * Run a gitagent agent using OpenCode (sst/opencode).
 *
 * Creates a temporary workspace with:
 *   - .opencode/instructions.md  (agent instructions)
 *   - opencode.json              (provider + model config)
 *
 * Then launches `opencode` in that workspace. OpenCode reads both files
 * automatically on startup.
 *
 * Supports both interactive mode (no prompt) and single-shot mode (-p).
 */
export function runWithOpenCode(agentDir: string, manifest: AgentManifest, options: OpenCodeRunOptions = {}): void {
  const exp = exportToOpenCode(agentDir);

  // Create a temporary workspace
  const workspaceDir = join(tmpdir(), `gitagent-opencode-${randomBytes(4).toString('hex')}`);
  mkdirSync(workspaceDir, { recursive: true });

  // Write .opencode/instructions.md
  const instructionsDir = join(workspaceDir, '.opencode');
  mkdirSync(instructionsDir, { recursive: true });
  writeFileSync(join(instructionsDir, 'instructions.md'), exp.instructions, 'utf-8');

  // Write opencode.json
  writeFileSync(join(workspaceDir, 'opencode.json'), JSON.stringify(exp.config, null, 2), 'utf-8');

  info(`Workspace prepared at ${workspaceDir}`);
  info(`  .opencode/instructions.md, opencode.json`);
  if (manifest.model?.preferred) {
    info(`  Model: ${manifest.model.preferred}`);
  }

  // Build opencode CLI args
  const args: string[] = [];

  // If a prompt is provided, pass it for single-shot mode
  if (options.prompt) {
    args.push('--prompt', options.prompt);
  }

  info(`Launching OpenCode agent "${manifest.name}"...`);
  if (!options.prompt) {
    info('Starting interactive mode. Type your messages to chat.');
  }

  try {
    const result = spawnSync('opencode', args, {
      stdio: 'inherit',
      cwd: workspaceDir,
      env: { ...process.env },
    });

    if (result.error) {
      error(`Failed to launch OpenCode: ${result.error.message}`);
      info('Make sure OpenCode is installed: npm install -g opencode');
      info('Or: brew install sst/tap/opencode');
      process.exit(1);
    }

    process.exit(result.status ?? 0);
  } finally {
    // Cleanup temp workspace
    try { rmSync(workspaceDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
