import axios, { AxiosInstance, AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs-extra';
import { config } from './config';
import type { 
  Operation, 
  Recording, 
  UploadOptions, 
  AuthResponse, 
  ApiError 
} from '../types';

export class BoxsApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.get('apiUrl'),
      timeout: 60000, // 60 seconds for large uploads
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add error handling interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please run "boxs login" again.');
        }
        
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message,
          code: error.response?.data?.code,
          details: error.response?.data,
        };
        
        throw apiError;
      }
    );
  }

  private getToken(): string | undefined {
    return config.get('token');
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/api/auth/cli/login', {
      email,
      password,
    });
    
    return response.data;
  }

  async validateToken(): Promise<boolean> {
    try {
      await this.client.get('/api/auth/cli/validate');
      return true;
    } catch {
      return false;
    }
  }

  async getOperations(): Promise<Operation[]> {
    const response: AxiosResponse<Operation[]> = await this.client.get('/api/operations');
    return response.data;
  }

  async createOperation(data: {
    title: string;
    description?: string;
    campaignId?: string;
  }): Promise<Operation> {
    const response: AxiosResponse<Operation> = await this.client.post('/api/operations', data);
    return response.data;
  }

  async uploadRecording(
    operationId: string,
    filePaths: string[],
    options: UploadOptions
  ): Promise<Recording> {
    const formData = new FormData();
    
    // Add files
    for (const filePath of filePaths) {
      const fileStream = fs.createReadStream(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      formData.append('files', fileStream, fileName);
    }
    
    // Add metadata
    formData.append('title', options.title);
    if (options.description) formData.append('description', options.description);
    if (options.campaignId) formData.append('campaignId', options.campaignId);
    if (options.format) formData.append('format', options.format);
    if (options.merge) formData.append('merge', 'true');
    if (options.phases) formData.append('phases', JSON.stringify(options.phases));

    const response: AxiosResponse<Recording> = await this.client.post(
      `/api/operations/${operationId}/recording/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return response.data;
  }

  async createOperationWithUpload(
    filePaths: string[],
    options: UploadOptions
  ): Promise<{ operation: Operation; recording: Recording }> {
    const formData = new FormData();
    
    // Add files
    for (const filePath of filePaths) {
      const fileStream = fs.createReadStream(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      formData.append('files', fileStream, fileName);
    }
    
    // Add metadata
    formData.append('title', options.title);
    if (options.description) formData.append('description', options.description);
    if (options.campaignId) formData.append('campaignId', options.campaignId);
    if (options.format) formData.append('format', options.format);
    if (options.merge) formData.append('merge', 'true');
    if (options.phases) formData.append('phases', JSON.stringify(options.phases));

    const response = await this.client.post('/api/operations/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  }

  async getRecording(operationId: string): Promise<Recording> {
    const response: AxiosResponse<Recording> = await this.client.get(
      `/api/operations/${operationId}/recording`
    );
    return response.data;
  }
}

export const api = new BoxsApiClient();