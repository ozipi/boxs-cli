import { config } from '../lib/config';
import { api } from '../lib/api';
import { output } from '../utils/output';

interface ListOptions {
  limit: string;
  campaign?: string;
}

export async function listCommand(options: ListOptions): Promise<void> {
  try {
    output.header('Your Operations');

    // Check authentication
    if (!config.isAuthenticated()) {
      output.error('Not authenticated. Please run "boxs login" first.');
      process.exit(1);
    }

    output.startSpinner('Fetching operations...');

    // Get operations from API
    const operations = await api.getOperations();

    output.stopSpinner();

    if (operations.length === 0) {
      output.info('No operations found');
      output.divider();
      output.info('Create your first operation by recording:');
      output.log('  boxs start "Your First Operation"');
      output.log('  # ... perform your pentesting work');
      output.log('  boxs stop');
      output.divider();
      output.info('Or upload existing logs:');
      output.log('  boxs upload session.log --title "Previous Work"');
      return;
    }

    // Filter by campaign if specified
    let filteredOps = operations;
    if (options.campaign) {
      filteredOps = operations.filter(op => 
        op.campaignId?.toLowerCase().includes(options.campaign!.toLowerCase())
      );
      
      if (filteredOps.length === 0) {
        output.warn(`No operations found for campaign: ${options.campaign}`);
        return;
      }
    }

    // Apply limit
    const limit = parseInt(options.limit, 10);
    if (limit > 0) {
      filteredOps = filteredOps.slice(0, limit);
    }

    // Format for table display
    const tableData = filteredOps.map(op => ({
      ID: op.id.substring(0, 8) + '...',
      Title: op.title.length > 30 ? op.title.substring(0, 27) + '...' : op.title,
      Campaign: op.campaignId || '-',
      Status: op.status,
      Duration: op.duration ? output.formatDuration(op.duration) : '-',
      Commands: op.commandCount?.toString() || '-',
      Created: formatDate(op.createdAt),
    }));

    output.table(tableData);

    // Show summary
    output.divider();
    
    if (options.campaign) {
      output.info(`Showing ${filteredOps.length} operations for campaign "${options.campaign}"`);
    } else {
      output.info(`Showing ${filteredOps.length} of ${operations.length} operations`);
    }

    if (filteredOps.length < operations.length) {
      output.info(`Use --limit to show more (current: ${limit})`);
    }

    // Show campaign summary if not filtering
    if (!options.campaign) {
      const campaigns = [...new Set(operations.map(op => op.campaignId).filter(Boolean))];
      if (campaigns.length > 0) {
        output.info(`Available campaigns: ${campaigns.join(', ')}`);
      }
    }

    output.divider();
    output.info('View operations online:');
    output.log(`${config.get('apiUrl')}/operations`);

  } catch (error) {
    output.error(`Failed to list operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error && error.message.includes('authentication')) {
      output.info('Tip: Your session may have expired. Try "boxs login" again');
    }
    
    process.exit(1);
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch {
    return 'Unknown';
  }
}