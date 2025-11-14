import { supabase } from '@/integrations/supabase/client';

export type RagStore = { 
  name: string; 
  displayName: string; 
};

export type Document = { 
  name: string; 
  displayName: string; 
  customMetadata: { key: string; stringValue: string }[];
  createTime?: string;
  sizeBytes?: string;
};

export type QueryResult = { 
  text: string; 
  groundingChunks: any[] 
};

// Store operations
export async function listRagStores(): Promise<RagStore[]> {
  const { data, error } = await supabase.functions.invoke('gemini-store-operations', {
    body: { operation: 'list' }
  });

  if (error) throw error;
  return data;
}

export async function createRagStore(displayName: string): Promise<RagStore> {
  const { data, error } = await supabase.functions.invoke('gemini-store-operations', {
    body: { operation: 'create', displayName }
  });

  if (error) throw error;
  return data;
}

export async function deleteRagStore(storeName: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('gemini-store-operations', {
    body: { operation: 'delete', storeName }
  });

  if (error) throw error;
}

// Document operations
export async function listDocuments(storeName: string): Promise<Document[]> {
  const { data, error } = await supabase.functions.invoke('gemini-document-operations', {
    body: { operation: 'list', storeName }
  });

  if (error) throw error;
  // Normalize displayName so UI can show original filename when Gemini doesn't return one
  return (data || []).map((d: any) => ({
    name: d.name,
    displayName:
      d.displayName ||
      (d.customMetadata?.find((m: any) => m.key === 'fileName')?.stringValue) ||
      d.name?.split('/')?.pop() ||
      'Untitled Document',
    customMetadata: d.customMetadata || [],
    createTime: d.createTime,
    sizeBytes: d.sizeBytes,
  }));
}

export async function uploadDocument(
  storeName: string,
  file: File,
  displayName?: string,
  customMetadata?: { key: string; stringValue: string }[]
): Promise<void> {
  const uploadFormData = new FormData();
  uploadFormData.append('operation', 'upload');
  uploadFormData.append('storeName', storeName);
  uploadFormData.append('file', file);
  uploadFormData.append('displayName', displayName || file.name);
  
  // Add custom metadata if provided
  if (customMetadata && customMetadata.length > 0) {
    uploadFormData.append('customMetadata', JSON.stringify(customMetadata));
  }

  const uploadResponse = await fetch(
    'https://zyxiznikuvpwmopraauj.supabase.co/functions/v1/gemini-document-operations',
    {
      method: 'POST',
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eGl6bmlrdXZwd21vcHJhYXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDU5ODQsImV4cCI6MjA2NDQyMTk4NH0.YNf5WA5grzswrRKl5SfiZh1dZM9esA66vvHI5fATPm8',
      },
      body: uploadFormData,
    }
  );

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    let message = 'Upload failed';
    try {
      const err = text ? JSON.parse(text) : null;
      message = err?.error || message;
    } catch {}
    throw new Error(message);
  }
}

export async function deleteDocument(documentName: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('gemini-document-operations', {
    body: { operation: 'delete', documentName }
  });

  if (error) throw error;
}

// Query operations
export async function fileSearch(
  storeName: string, 
  query: string, 
  isPreciseMode: boolean = false
): Promise<QueryResult> {
  const { data, error } = await supabase.functions.invoke('gemini-file-search', {
    body: { storeName, query, isPreciseMode }
  });

  if (error) throw error;
  return data;
}

// Database storage for active store (centralized across all devices)
import { adminSettingsService } from './adminSettingsService';

const ACTIVE_STORE_KEY = 'gemini_active_store'; // Keep for migration

export async function getActiveStore(): Promise<string | null> {
  // Migration: Move from localStorage to database if exists
  const localStore = localStorage.getItem(ACTIVE_STORE_KEY);
  if (localStore) {
    try {
      await adminSettingsService.setActiveGeminiStore(localStore);
      localStorage.removeItem(ACTIVE_STORE_KEY);
      console.log('Migrated active store from localStorage to database');
    } catch (error) {
      console.error('Failed to migrate active store:', error);
    }
  }

  return await adminSettingsService.getActiveGeminiStore();
}

export async function setActiveStore(storeName: string): Promise<void> {
  await adminSettingsService.setActiveGeminiStore(storeName);
  // Also remove from localStorage if it exists
  localStorage.removeItem(ACTIVE_STORE_KEY);
}

export async function clearActiveStore(): Promise<void> {
  await adminSettingsService.setActiveGeminiStore(null);
  localStorage.removeItem(ACTIVE_STORE_KEY);
}

export const geminiRagService = {
  listRagStores,
  createRagStore,
  deleteRagStore,
  listDocuments,
  uploadDocument,
  deleteDocument,
  fileSearch,
  getActiveStore,
  setActiveStore,
  clearActiveStore,
};
