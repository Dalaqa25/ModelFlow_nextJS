#!/usr/bin/env node

const { spawn } = require('node:child_process');

const purple = '\x1b[35m';
const violet = '\x1b[95m';
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const dim = '\x1b[2m';
const bold = '\x1b[1m';
const reset = '\x1b[0m';

const lines = [
  '',
  `${violet}${bold}╔════════════════════════════════════════════════════════════╗${reset}`,
  `${violet}${bold}║${reset}  🔥 ⚔️  ${bold}MODELGROW DEV SERVER${reset}  ⚔️ 🔥                       ${violet}${bold}║${reset}`,
  `${violet}${bold}╠════════════════════════════════════════════════════════════╣${reset}`,
  `${violet}${bold}║${reset}  🛡️  Build with discipline.                                 ${violet}${bold}║${reset}`,
  `${violet}${bold}║${reset}  🗡️  Ship with precision.                                  ${violet}${bold}║${reset}`,
  `${violet}${bold}║${reset}  🚀  Keep moving. Fix the bug. Launch the thing.             ${violet}${bold}║${reset}`,
  `${violet}${bold}║${reset}  ⚡  No panic. No excuses. Just execution.                   ${violet}${bold}║${reset}`,
  `${violet}${bold}╚════════════════════════════════════════════════════════════╝${reset}`,
  `${dim}${cyan}Starting Next.js… warnings below are framework diagnostics, not defeat.${reset}`,
  '',
];

console.log(lines.join('\n'));

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
