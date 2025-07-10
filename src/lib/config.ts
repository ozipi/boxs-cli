import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { BoxsConfig } from '../types';

const CONFIG_FILE = path.join(os.homedir(), '.boxs-config.json');

const DEFAULT_CONFIG: BoxsConfig = {
  apiUrl: 'https://boxs.dev', // Default to production URL
};

export class ConfigManager {
  private config: BoxsConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): BoxsConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const configData = fs.readJsonSync(CONFIG_FILE);
        return { ...DEFAULT_CONFIG, ...configData };
      }
    } catch (error) {
      console.warn('Warning: Could not load config file, using defaults');
    }
    return { ...DEFAULT_CONFIG };
  }

  public saveConfig(): void {
    try {
      fs.ensureDirSync(path.dirname(CONFIG_FILE));
      fs.writeJsonSync(CONFIG_FILE, this.config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  public get<K extends keyof BoxsConfig>(key: K): BoxsConfig[K] {
    return this.config[key];
  }

  public set<K extends keyof BoxsConfig>(key: K, value: BoxsConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  public getAll(): BoxsConfig {
    return { ...this.config };
  }

  public clear(): void {
    this.config = { ...DEFAULT_CONFIG };
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        fs.removeSync(CONFIG_FILE);
      }
    } catch (error) {
      console.warn('Warning: Could not remove config file');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.config.token;
  }
}

export const config = new ConfigManager();