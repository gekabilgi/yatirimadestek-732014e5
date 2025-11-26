import { supabase } from "@/integrations/supabase/client";

export interface CustomRagStore {
  id: string;
  name: string;
  display_name: string;
  embedding_model: string;
  embedding_dimensions: number;
  chunk_size: number;
  chunk_overlap: number;
  is_active: boolean;
  created_at: string;
}

export interface CustomRagDocument {
  id: string;
  store_id: string;
  name: string;
  display_name: string;
  file_type: string;
  file_size: number;
  status: string;
  error_message?: string;
  chunks_count: number;
  created_at: string;
}

export const customRagService = {
  async listStores(): Promise<CustomRagStore[]> {
    const { data, error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "list_stores" },
    });

    if (error) throw error;
    return data.stores;
  },

  async createStore(params: {
    name: string;
    displayName: string;
    embeddingModel: "gemini" | "openai";
    embeddingDimensions: number;
    chunkSize: number;
    chunkOverlap: number;
  }): Promise<CustomRagStore> {
    const { data, error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "create_store", ...params },
    });

    if (error) throw error;
    return data.store;
  },

  async deleteStore(storeId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "delete_store", storeId },
    });

    if (error) throw error;
  },

  async setActiveStore(storeId: string | null): Promise<void> {
    const { error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "set_active_store", storeId },
    });

    if (error) throw error;
  },

  async listDocuments(storeId: string): Promise<CustomRagDocument[]> {
    const { data, error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "list_documents", storeId },
    });

    if (error) throw error;
    return data.documents;
  },

  async uploadDocument(params: {
    storeId: string;
    fileName: string;
    content: string;
    fileType: string;
    fileSize: number;
  }): Promise<{ document: CustomRagDocument; chunksCount: number }> {
    const { data, error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "upload_document", ...params },
    });

    if (error) throw error;
    return data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "delete_document", documentId },
    });

    if (error) throw error;
  },

  async testSearch(params: {
    storeId: string;
    query: string;
    matchCount?: number;
  }): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke("custom-rag-operations", {
      body: { operation: "search", ...params },
    });

    if (error) throw error;
    return data.results;
  },
};
