import { config } from '../lib/config';
import { api } from '../lib/api';
import { recorder } from '../utils/recording';
import { output } from '../utils/output';

interface StopOptions {
  upload: boolean;
}

export async function stopCommand(options: StopOptions): Promise<void> {
  try {
    output.header('Stop Recording');

    // Check if recording
    if (!recorder.isRecording()) {
      output.error('No recording in progress');
      process.exit(1);
    }

    const currentRecording = recorder.getCurrentRecording();
    if (!currentRecording) {
      output.error('Could not get current recording info');
      process.exit(1);
    }

    output.info(`Stopping recording: ${currentRecording.title}`);
    output.info(`Duration: ${output.formatDuration(currentRecording.duration)}`);
    
    output.startSpinner('Stopping recording...');

    // Stop the recording
    const result = await recorder.stopRecording();
    
    if (!result) {
      output.error('Failed to stop recording');
      process.exit(1);
    }

    output.success('Recording stopped successfully!');
    output.info(`Saved to: ${result.filePath}`);
    output.info(`Final duration: ${output.formatDuration(result.duration)}`);

    // Upload if requested (default is true)
    if (options.upload) {
      output.divider();
      await uploadRecording(result.filePath, currentRecording.title);
    } else {
      output.divider();
      output.info('Recording saved locally. Upload later with:');
      output.log(`boxs upload "${result.filePath}" --title "${currentRecording.title}"`);
    }

  } catch (error) {
    output.error(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

async function uploadRecording(filePath: string, title: string): Promise<void> {
  try {
    // Check authentication
    if (!config.isAuthenticated()) {
      output.error('Not authenticated. Cannot upload recording.');
      output.info('Recording saved locally. Login and upload later.');
      return;
    }

    output.startSpinner('Uploading recording...');

    // Detect file format
    const format = recorder.detectFileFormat(filePath);
    output.updateSpinner(`Uploading recording (${format})...`);

    // Create operation with upload
    const defaultCampaign = config.get('defaultCampaign');
    const uploadOptions = {
      title,
      campaignId: defaultCampaign,
      format,
    };

    const result = await api.createOperationWithUpload([filePath], uploadOptions);

    output.success('Recording uploaded successfully!');
    output.info(`Operation ID: ${result.operation.id}`);
    output.info(`Title: ${result.operation.title}`);
    
    if (result.recording.hasTimingData) {
      output.info('✓ Timing data preserved - full interactive replay available');
    } else {
      output.info('ℹ Static log uploaded - command analysis available');
    }

    if (result.recording.detectedTools.length > 0) {
      output.info(`Detected tools: ${result.recording.detectedTools.join(', ')}`);
    }

    output.divider();
    output.info(`View your operation at: ${config.get('apiUrl')}/operations/${result.operation.id}`);

  } catch (error) {
    output.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    output.info(`Recording saved locally at: ${filePath}`);
    output.info('You can upload it later with:');
    output.log(`boxs upload "${filePath}" --title "${title}"`);
  }
}