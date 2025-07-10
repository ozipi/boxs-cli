import { config } from '../lib/config';
import { api } from '../lib/api';
import { recorder } from '../utils/recording';
import { output } from '../utils/output';
import type { RecordingFormat } from '../types';

interface UploadOptions {
  title?: string;
  campaign?: string;
  description?: string;
  merge?: boolean;
  format?: RecordingFormat;
}

export async function uploadCommand(files: string[], options: UploadOptions): Promise<void> {
  try {
    output.header('Upload Files');

    // Check authentication
    if (!config.isAuthenticated()) {
      output.error('Not authenticated. Please run "boxs login" first.');
      process.exit(1);
    }

    // Validate files
    if (!files || files.length === 0) {
      output.error('No files specified');
      process.exit(1);
    }

    output.startSpinner('Validating files...');
    const validation = await recorder.validateFiles(files);

    if (validation.invalid.length > 0) {
      output.error('Some files are invalid:');
      validation.invalid.forEach(error => output.log(`  ${error}`));
      
      if (validation.valid.length === 0) {
        process.exit(1);
      }
      
      output.warn(`Proceeding with ${validation.valid.length} valid file(s)`);
    }

    const validFiles = validation.valid;
    output.updateSpinner(`Processing ${validFiles.length} file(s)...`);

    // Determine title
    let title = options.title;
    if (!title) {
      if (validFiles.length === 1) {
        const firstFile = validFiles[0];
        if (firstFile) {
          const fileName = firstFile.split('/').pop() || 'Unknown';
          title = fileName.replace(/\.[^/.]+$/, ''); // Remove extension
        } else {
          title = 'Unknown Operation';
        }
      } else {
        title = `Multi-file operation (${validFiles.length} files)`;
      }
    }

    // Detect formats and show file info
    output.stopSpinner();
    output.info(`Uploading ${validFiles.length} file(s):`);
    
    const fileInfo = validFiles.map(file => {
      const detectedFormat = options.format || recorder.detectFileFormat(file);
      const fileName = file.split('/').pop() || 'Unknown';
      return { file: fileName, format: detectedFormat };
    });

    fileInfo.forEach(info => {
      output.log(`  ${info.file} (${info.format})`);
    });

    output.divider();
    output.info(`Operation title: ${title}`);
    if (options.campaign) {
      output.info(`Campaign: ${options.campaign}`);
    }
    if (options.description) {
      output.info(`Description: ${options.description}`);
    }
    if (options.merge && validFiles.length > 1) {
      output.info('Merging files into single operation');
    }

    output.startSpinner('Uploading to Boxs platform...');

    // Prepare upload options
    const defaultCampaign = options.campaign || config.get('defaultCampaign');
    const uploadOptions = {
      title,
      description: options.description,
      campaignId: defaultCampaign,
      format: options.format,
      merge: options.merge,
    };

    // Upload files
    const result = await api.createOperationWithUpload(validFiles, uploadOptions);

    output.success('Upload completed successfully!');
    output.divider();

    // Show results
    output.info('Operation Details:');
    output.log(`  ID: ${result.operation.id}`);
    output.log(`  Title: ${result.operation.title}`);
    if (result.operation.campaignId) {
      output.log(`  Campaign: ${result.operation.campaignId}`);
    }

    output.divider();
    output.info('Recording Analysis:');
    output.log(`  Format: ${result.recording.fileFormat}`);
    output.log(`  File size: ${output.formatFileSize(result.recording.fileSize)}`);
    output.log(`  Commands: ${result.recording.commandCount}`);
    
    if (result.recording.hasTimingData) {
      output.log(`  Duration: ${result.recording.duration ? output.formatDuration(result.recording.duration) : 'Unknown'}`);
      output.success('✓ Timing data preserved - interactive replay available');
    } else {
      output.info('ℹ Static analysis - command extraction and phase detection available');
    }

    if (result.recording.detectedTools.length > 0) {
      output.log(`  Detected tools: ${result.recording.detectedTools.join(', ')}`);
    }

    if (result.recording.targets.length > 0) {
      output.log(`  Targets found: ${result.recording.targets.join(', ')}`);
    }

    output.divider();
    output.success(`View your operation at: ${config.get('apiUrl')}/operations/${result.operation.id}`);

    // Show processing status if not completed
    if (result.recording.processingStatus !== 'COMPLETED') {
      output.info(`Processing status: ${result.recording.processingStatus}`);
      output.info('Additional analysis may appear after processing completes');
    }

  } catch (error) {
    output.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('file too large')) {
        output.info('Tip: Try uploading smaller files or compress large logs');
      } else if (error.message.includes('authentication')) {
        output.info('Tip: Your session may have expired. Try "boxs login" again');
      } else if (error.message.includes('network')) {
        output.info('Tip: Check your internet connection and API URL');
      }
    }
    
    process.exit(1);
  }
}