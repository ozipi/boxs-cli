#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// Import commands
import { loginCommand } from './commands/auth';
import { logoutCommand } from './commands/auth';
import { configCommand } from './commands/config';
import { startCommand } from './commands/start';
import { stopCommand } from './commands/stop';
import { uploadCommand } from './commands/upload';
import { listCommand } from './commands/list';
import { statusCommand } from './commands/status';

// Read package.json for version
const packagePath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

const program = new Command();

program
  .name('boxs')
  .description('CLI tool for recording and uploading pentesting operations to the Boxs platform')
  .version(packageJson.version);

// Add ASCII art banner
program.addHelpText('before', chalk.cyan(`
  ██████╗  ██████╗ ██╗  ██╗███████╗
  ██╔══██╗██╔═══██╗╚██╗██╔╝██╔════╝
  ██████╔╝██║   ██║ ╚███╔╝ ███████╗
  ██╔══██╗██║   ██║ ██╔██╗ ╚════██║
  ██████╔╝╚██████╔╝██╔╝ ██╗███████║
  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝
  
  Record and analyze your pentesting operations
`));

// Authentication commands
program
  .command('login')
  .description('Login to Boxs platform')
  .option('-u, --url <url>', 'API URL (default: https://boxs.sh)')
  .action(loginCommand);

program
  .command('logout')
  .description('Logout and clear credentials')
  .action(logoutCommand);

// Configuration command
program
  .command('config')
  .description('View and manage configuration')
  .option('-s, --set <key=value>', 'Set configuration value')
  .option('-g, --get <key>', 'Get configuration value')
  .option('-l, --list', 'List all configuration')
  .action(configCommand);

// Recording commands
program
  .command('start')
  .description('Start recording a new operation')
  .argument('<title>', 'Operation title')
  .option('-c, --campaign <campaign>', 'Campaign name')
  .option('-d, --description <description>', 'Operation description')
  .option('-o, --output <directory>', 'Output directory for recording files')
  .action(startCommand);

program
  .command('stop')
  .description('Stop current recording and upload')
  .option('--no-upload', 'Stop recording without uploading')
  .action(stopCommand);

program
  .command('upload')
  .description('Upload existing log files')
  .argument('<files...>', 'Files to upload')
  .option('-t, --title <title>', 'Operation title')
  .option('-c, --campaign <campaign>', 'Campaign name')
  .option('-d, --description <description>', 'Operation description')
  .option('-m, --merge', 'Merge multiple files into single operation')
  .option('-f, --format <format>', 'Force specific format detection')
  .action(uploadCommand);

// Management commands
program
  .command('list')
  .description('List your operations')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('-c, --campaign <campaign>', 'Filter by campaign')
  .action(listCommand);

program
  .command('status')
  .description('Show current recording status')
  .action(statusCommand);

// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled promise rejection:'), reason);
  process.exit(1);
});

// Parse arguments
program.parse();

export default program;