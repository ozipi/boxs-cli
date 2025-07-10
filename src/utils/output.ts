import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class OutputManager {
  private spinner: Ora | null = null;

  success(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    } else {
      console.log(chalk.green('✓'), message);
    }
  }

  error(message: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    } else {
      console.error(chalk.red('✗'), message);
    }
  }

  warn(message: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    } else {
      console.warn(chalk.yellow('⚠'), message);
    }
  }

  info(message: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    } else {
      console.log(chalk.blue('ℹ'), message);
    }
  }

  log(message: string): void {
    if (this.spinner) {
      this.spinner.stop();
      console.log(message);
      this.spinner.start();
    } else {
      console.log(message);
    }
  }

  startSpinner(message: string): void {
    this.spinner = ora(message).start();
  }

  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  table(data: Record<string, string>[]): void {
    if (data.length === 0) {
      this.info('No data to display');
      return;
    }

    const firstRow = data[0];
    if (!firstRow) {
      this.info('No data to display');
      return;
    }

    const keys = Object.keys(firstRow);
    const maxWidths = keys.map(key => 
      Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    );

    // Header
    const header = keys.map((key, i) => key.padEnd(maxWidths[i] || 0)).join('  ');
    console.log(chalk.bold(header));
    console.log('-'.repeat(header.length));

    // Rows
    data.forEach(row => {
      const line = keys.map((key, i) => 
        String(row[key] || '').padEnd(maxWidths[i] || 0)
      ).join('  ');
      console.log(line);
    });
  }

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  header(title: string): void {
    console.log();
    console.log(chalk.bold.cyan(`📦 ${title}`));
    console.log(chalk.gray('─'.repeat(title.length + 3)));
  }

  divider(): void {
    console.log();
  }
}

export const output = new OutputManager();