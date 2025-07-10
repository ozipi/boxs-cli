import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import type { RecordingFormat } from '../types';

export class RecordingManager {
  private currentRecording?: {
    process: ChildProcess;
    filePath: string;
    title: string;
    startTime: Date;
  };

  async startRecording(title: string, outputDir?: string): Promise<string> {
    if (this.currentRecording) {
      throw new Error('Recording already in progress. Stop the current recording first.');
    }

    const recordingDir = outputDir || path.join(os.homedir(), '.boxs', 'recordings');
    await fs.ensureDir(recordingDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${title.replace(/[^a-zA-Z0-9\s-]/g, '')}-${timestamp}.cast`;
    const filePath = path.join(recordingDir, fileName);

    return new Promise((resolve, reject) => {
      // Try asciinema first, fallback to script command
      const asciinemaProcess = spawn('asciinema', ['rec', filePath, '--idle-time-limit', '60'], {
        stdio: 'inherit',
      });

      asciinemaProcess.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          // asciinema not found, try script command
          this.startScriptRecording(title, recordingDir)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`Failed to start asciinema recording: ${error.message}`));
        }
      });

      asciinemaProcess.on('spawn', () => {
        this.currentRecording = {
          process: asciinemaProcess,
          filePath,
          title,
          startTime: new Date(),
        };
        resolve(filePath);
      });
    });
  }

  private async startScriptRecording(title: string, recordingDir: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${title.replace(/[^a-zA-Z0-9\s-]/g, '')}-${timestamp}.script`;
    const filePath = path.join(recordingDir, fileName);

    return new Promise((resolve, reject) => {
      const scriptProcess = spawn('script', ['-q', filePath], {
        stdio: 'inherit',
      });

      scriptProcess.on('error', (error) => {
        reject(new Error(`Failed to start script recording: ${error.message}`));
      });

      scriptProcess.on('spawn', () => {
        this.currentRecording = {
          process: scriptProcess,
          filePath,
          title,
          startTime: new Date(),
        };
        resolve(filePath);
      });
    });
  }

  async stopRecording(): Promise<{ filePath: string; duration: number } | null> {
    if (!this.currentRecording) {
      return null;
    }

    const { process, filePath, startTime } = this.currentRecording;
    const duration = Date.now() - startTime.getTime();

    return new Promise((resolve) => {
      process.on('exit', () => {
        this.currentRecording = undefined;
        resolve({ filePath, duration });
      });

      // Send SIGTERM to gracefully stop the recording
      process.kill('SIGTERM');
      
      // Force kill after 5 seconds if it doesn't exit gracefully
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  isRecording(): boolean {
    return !!this.currentRecording;
  }

  getCurrentRecording(): { title: string; startTime: Date; duration: number } | null {
    if (!this.currentRecording) {
      return null;
    }

    return {
      title: this.currentRecording.title,
      startTime: this.currentRecording.startTime,
      duration: Date.now() - this.currentRecording.startTime.getTime(),
    };
  }

  detectFileFormat(filePath: string): RecordingFormat {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath).toLowerCase();

    // Check file extension first
    switch (ext) {
      case '.cast':
        return 'ASCIINEMA';
      case '.script':
        return 'SCRIPT';
      case '.xml':
        return 'TOOL_OUTPUT';
      case '.md':
        return 'MARKDOWN';
      case '.log':
      case '.txt':
        // Check content for timestamps to determine if it's timestamped
        try {
          const content = fs.readFileSync(filePath, 'utf8').substring(0, 1000);
          if (this.hasTimestamps(content)) {
            return 'TIMESTAMPED';
          }
        } catch {
          // If we can't read the file, assume raw log
        }
        return 'RAW_LOG';
      default:
        // Check filename patterns for tool outputs
        if (fileName.includes('nmap') || fileName.includes('scan')) {
          return 'TOOL_OUTPUT';
        }
        if (fileName.includes('gobuster') || fileName.includes('dirb')) {
          return 'TOOL_OUTPUT';
        }
        return 'RAW_LOG';
    }
  }

  private hasTimestamps(content: string): boolean {
    // Look for common timestamp patterns
    const timestampPatterns = [
      /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/, // ISO format
      /\[\d{2}:\d{2}:\d{2}\]/, // [HH:MM:SS]
      /\d{2}:\d{2}:\d{2}/, // HH:MM:SS
      /\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/, // Mon Jan 01 12:00:00
    ];

    return timestampPatterns.some(pattern => pattern.test(content));
  }

  async validateFiles(filePaths: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile() && stats.size > 0) {
          valid.push(filePath);
        } else {
          invalid.push(`${filePath}: Not a valid file or empty`);
        }
      } catch (error) {
        invalid.push(`${filePath}: ${error}`);
      }
    }

    return { valid, invalid };
  }
}

export const recorder = new RecordingManager();