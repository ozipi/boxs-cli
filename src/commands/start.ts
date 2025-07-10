import { config } from '../lib/config';
import { recorder } from '../utils/recording';
import { output } from '../utils/output';

interface StartOptions {
  campaign?: string;
  description?: string;
  output?: string;
}

export async function startCommand(title: string, options: StartOptions): Promise<void> {
  try {
    output.header('Start Recording');

    // Check authentication
    if (!config.isAuthenticated()) {
      output.error('Not authenticated. Please run "boxs login" first.');
      process.exit(1);
    }

    // Check if already recording
    if (recorder.isRecording()) {
      output.error('Recording already in progress. Stop the current recording first.');
      process.exit(1);
    }

    // Validate title
    if (!title || title.trim().length === 0) {
      output.error('Operation title is required');
      process.exit(1);
    }

    output.info(`Starting recording for: ${title}`);
    if (options.campaign) {
      output.info(`Campaign: ${options.campaign}`);
    }
    if (options.description) {
      output.info(`Description: ${options.description}`);
    }

    output.startSpinner('Initializing recording...');

    // Start the recording
    const filePath = await recorder.startRecording(title, options.output);
    
    output.success('Recording started successfully!');
    output.info(`Recording to: ${filePath}`);
    output.divider();
    
    // Instructions
    console.log('📹 Recording in progress...');
    console.log('');
    console.log('Your terminal session is now being recorded.');
    console.log('Perform your pentesting operations normally.');
    console.log('');
    console.log('When finished, run: boxs stop');
    console.log('');
    console.log('Tips:');
    console.log('• Use clear command names for better analysis');
    console.log('• Add comments with # for important steps');
    console.log('• The recording captures all input and output');

  } catch (error) {
    output.error(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('asciinema') && error.message.includes('ENOENT')) {
        output.info('Tip: Install asciinema for better recording support: https://asciinema.org/docs/installation');
      } else if (error.message.includes('script') && error.message.includes('ENOENT')) {
        output.info('Tip: Neither asciinema nor script command found. Please install recording tools.');
      }
    }
    
    process.exit(1);
  }
}