import { supabase } from '@/integrations/supabase/client';

export type RagStore = { 
  name: string; 
  displayName: string; 
};

export type Document = { 
  name: string; 
  displayName: string; 
  customMetadata: { key: string; stringValue: string }[] 
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
  return data;
}

export async function uploadDocument(
  storeName: string,
  file: File,
  displayName?: string
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('displayName', displayName || file.name);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-document-operations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        operation: 'upload',
        storeName,
      }),
    }
  );

  // Use multipart for actual upload
  const uploadFormData = new FormData();
  uploadFormData.append('operation', 'upload');
  uploadFormData.append('storeName', storeName);
  uploadFormData.append('file', file);
  uploadFormData.append('displayName', displayName || file.name);

  const uploadResponse = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-document-operations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: uploadFormData,
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(error.error || 'Upload failed');
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

// Local storage for active store
const ACTIVE_STORE_KEY = 'gemini_active_store';

export function getActiveStore(): string | null {
  return localStorage.getItem(ACTIVE_STORE_KEY);
}

export function setActiveStore(storeName: string): void {
  localStorage.setItem(ACTIVE_STORE_KEY, storeName);
}

export function clearActiveStore(): void {
  localStorage.removeItem(ACTIVE_STORE_KEY);
}
