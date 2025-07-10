export interface BoxsConfig {
  apiUrl: string;
  token?: string;
  defaultCampaign?: string;
}

export interface Operation {
  id: string;
  title: string;
  description?: string;
  campaignId?: string;
  status: 'PRIVATE' | 'PUBLIC' | 'TEAM' | 'BROADCASTING';
  duration?: number;
  commandCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Recording {
  id: string;
  operationId: string;
  originalFilename: string;
  fileFormat: RecordingFormat;
  fileSize: number;
  hasTimingData: boolean;
  duration?: number;
  commandCount: number;
  errorCount: number;
  detectedTools: string[];
  phases?: PhaseData;
  targets: string[];
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export type RecordingFormat = 
  | 'ASCIINEMA'
  | 'SCRIPT'
  | 'RAW_LOG'
  | 'TIMESTAMPED'
  | 'TOOL_OUTPUT'
  | 'MARKDOWN'
  | 'MULTIPLE_FILES';

export interface PhaseData {
  [phase: string]: {
    start: number;
    end: number;
    commands: number;
    tools: string[];
  };
}

export interface UploadOptions {
  title: string;
  description?: string;
  campaignId?: string;
  format?: RecordingFormat;
  phases?: PhaseData;
  merge?: boolean;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}