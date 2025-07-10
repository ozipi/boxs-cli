import { config } from '../lib/config';
import { api } from '../lib/api';
import { output } from '../utils/output';
import * as readline from 'readline';

interface LoginOptions {
  url?: string;
}

export async function loginCommand(options: LoginOptions): Promise<void> {
  try {
    output.header('Login to Boxs Platform');

    // Set API URL if provided
    if (options.url) {
      config.set('apiUrl', options.url);
      output.info(`API URL set to: ${options.url}`);
    }

    // Check if already logged in
    if (config.isAuthenticated()) {
      const isValid = await api.validateToken();
      if (isValid) {
        output.success('Already logged in!');
        return;
      } else {
        output.warn('Existing token is invalid, please login again');
      }
    }

    // Get credentials
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const email = await question(rl, 'Email: ');
    const password = await questionHidden(rl, 'Password: ');
    rl.close();

    output.startSpinner('Authenticating...');

    // Attempt login
    const authResponse = await api.login(email, password);
    
    // Save token
    config.set('token', authResponse.token);
    
    output.success(`Successfully logged in as ${authResponse.user.email}`);
    output.info(`Welcome${authResponse.user.name ? `, ${authResponse.user.name}` : ''}!`);

  } catch (error) {
    output.error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

export async function logoutCommand(): Promise<void> {
  try {
    output.header('Logout');

    if (!config.isAuthenticated()) {
      output.info('Not currently logged in');
      return;
    }

    // Clear configuration
    config.set('token', undefined);
    
    output.success('Successfully logged out');
    output.info('Your credentials have been cleared');

  } catch (error) {
    output.error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Helper functions for reading input
function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

function questionHidden(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char: string) => {
      char = char.toString();
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit(1);
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          stdout.write('*');
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}