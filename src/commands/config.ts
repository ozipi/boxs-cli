import { config } from '../lib/config';
import { output } from '../utils/output';

interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
}

export async function configCommand(options: ConfigOptions): Promise<void> {
  try {
    output.header('Configuration');

    if (options.set) {
      await setConfig(options.set);
    } else if (options.get) {
      await getConfig(options.get);
    } else if (options.list) {
      await listConfig();
    } else {
      // Default: show current config
      await listConfig();
    }

  } catch (error) {
    output.error(`Config command failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function setConfig(keyValue: string): Promise<void> {
  const [key, ...valueParts] = keyValue.split('=');
  const value = valueParts.join('=');

  if (!key || !value) {
    output.error('Invalid format. Use: --set key=value');
    return;
  }

  const validKeys = ['apiUrl', 'defaultCampaign'];
  
  if (!validKeys.includes(key)) {
    output.error(`Invalid key '${key}'. Valid keys: ${validKeys.join(', ')}`);
    return;
  }

  try {
    if (key === 'apiUrl') {
      // Validate URL format
      new URL(value);
    }

    config.set(key as any, value);
    output.success(`Set ${key} = ${value}`);
  } catch (error) {
    if (key === 'apiUrl') {
      output.error('Invalid URL format');
    } else {
      output.error(`Failed to set ${key}: ${error}`);
    }
  }
}

async function getConfig(key: string): Promise<void> {
  const value = config.get(key as any);
  
  if (value !== undefined) {
    // Hide sensitive information
    if (key === 'token') {
      const maskedToken = value ? `${value.substring(0, 8)}...` : 'Not set';
      output.info(`${key}: ${maskedToken}`);
    } else {
      output.info(`${key}: ${value}`);
    }
  } else {
    output.warn(`Configuration key '${key}' not found`);
  }
}

async function listConfig(): Promise<void> {
  const allConfig = config.getAll();
  
  const configData = [
    {
      Key: 'apiUrl',
      Value: allConfig.apiUrl || 'Not set',
      Description: 'Boxs platform API URL',
    },
    {
      Key: 'token',
      Value: allConfig.token ? `${allConfig.token.substring(0, 8)}...` : 'Not set',
      Description: 'Authentication token (masked)',
    },
    {
      Key: 'defaultCampaign',
      Value: allConfig.defaultCampaign || 'Not set',
      Description: 'Default campaign for new operations',
    },
  ];

  output.table(configData);

  if (!config.isAuthenticated()) {
    output.divider();
    output.warn('Not authenticated. Run "boxs login" to authenticate.');
  }
}