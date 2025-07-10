import { config } from '../lib/config';
import { api } from '../lib/api';
import { recorder } from '../utils/recording';
import { output } from '../utils/output';

export async function statusCommand(): Promise<void> {
  try {
    output.header('Status');

    // Check authentication status
    const isAuthenticated = config.isAuthenticated();
    
    if (isAuthenticated) {
      output.startSpinner('Validating authentication...');
      const isValidToken = await api.validateToken();
      output.stopSpinner();
      
      if (isValidToken) {
        output.success('✓ Authenticated');
      } else {
        output.error('✗ Authentication expired');
        output.info('Run "boxs login" to re-authenticate');
      }
    } else {
      output.warn('✗ Not authenticated');
      output.info('Run "boxs login" to authenticate');
    }

    // Check recording status
    const isRecording = recorder.isRecording();
    const currentRecording = recorder.getCurrentRecording();

    output.divider();
    
    if (isRecording && currentRecording) {
      output.success('🔴 Recording in progress');
      output.info(`Title: ${currentRecording.title}`);
      output.info(`Started: ${currentRecording.startTime.toLocaleString()}`);
      output.info(`Duration: ${output.formatDuration(currentRecording.duration)}`);
      output.divider();
      output.info('Run "boxs stop" to finish recording');
    } else {
      output.info('⚪ No recording in progress');
      output.info('Run "boxs start <title>" to begin recording');
    }

    // Show configuration
    output.divider();
    output.info('Configuration:');
    const allConfig = config.getAll();
    
    output.log(`  API URL: ${allConfig.apiUrl}`);
    output.log(`  Default Campaign: ${allConfig.defaultCampaign || 'Not set'}`);
    
    if (isAuthenticated) {
      // Try to get recent operations count
      try {
        output.startSpinner('Getting account info...');
        const operations = await api.getOperations();
        output.stopSpinner();
        
        output.log(`  Total Operations: ${operations.length}`);
        
        if (operations.length > 0) {
          const recentOp = operations[0]; // Assuming they're sorted by date
          if (recentOp) {
            output.log(`  Latest Operation: ${recentOp.title} (${formatDate(recentOp.createdAt)})`);
          }
        }
        
        // Show campaigns
        const campaigns = [...new Set(operations.map(op => op.campaignId).filter(Boolean))];
        if (campaigns.length > 0) {
          output.log(`  Campaigns: ${campaigns.join(', ')}`);
        }
        
      } catch (error) {
        output.stopSpinner();
        output.warn('Could not fetch account info');
      }
    }

    // Check system requirements
    output.divider();
    output.info('System Status:');
    
    // Check for recording tools
    await checkRecordingTools();

  } catch (error) {
    output.error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function checkRecordingTools(): Promise<void> {
  const { spawn } = require('child_process');
  
  // Check asciinema
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('asciinema', ['--version'], { stdio: 'pipe' });
      proc.on('close', (code: number) => {
        if (code === 0) {
          output.log('  ✓ asciinema available (recommended)');
          resolve();
        } else {
          reject();
        }
      });
      proc.on('error', reject);
    });
  } catch {
    // Check script command
    try {
      await new Promise<void>((resolve, reject) => {
        const proc = spawn('script', ['--version'], { stdio: 'pipe' });
        proc.on('close', (code: number) => {
          if (code === 0) {
            output.log('  ✓ script command available (basic recording)');
            resolve();
          } else {
            reject();
          }
        });
        proc.on('error', reject);
      });
    } catch {
      output.warn('  ✗ No recording tools found');
      output.info('    Install asciinema for best experience: https://asciinema.org/docs/installation');
      output.info('    Or ensure script command is available on your system');
    }
  }

  // Check Node.js version
  const nodeVersion = process.version;
  const versionParts = nodeVersion.slice(1).split('.');
  const majorVersion = parseInt(versionParts[0] || '0');
  
  if (majorVersion >= 16) {
    output.log(`  ✓ Node.js ${nodeVersion} (compatible)`);
  } else {
    output.warn(`  ⚠ Node.js ${nodeVersion} (upgrade recommended)`);
    output.info('    Consider upgrading to Node.js 16+ for best compatibility');
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return 'unknown date';
  }
}