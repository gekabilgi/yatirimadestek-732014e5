import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getAiClient(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    // Check content type to determine how to parse request
    const contentType = req.headers.get('content-type') || '';
    let operation, storeName, documentName, formData;

    if (contentType.includes('multipart/form-data')) {
      // For file uploads - parse formData once
      formData = await req.formData();
      operation = formData.get('operation') as string;
      storeName = formData.get('storeName') as string;
      documentName = formData.get('documentName') as string;
    } else {
      // For JSON requests
      const body = await req.json();
      operation = body.operation;
      storeName = body.storeName;
      documentName = body.documentName;
    }

    switch (operation) {
      case 'list': {
        if (!storeName) throw new Error("storeName required for list");
        
        console.log('Listing documents for store:', storeName);
        
        const response = await fetch(
          `${GEMINI_API_BASE}/${storeName}/documents?key=${GEMINI_API_KEY}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('List documents failed:', errorText);
          throw new Error(`Gemini API error: ${errorText}`);
        }

        const data = await response.json();
        const documents = data.documents || [];
        
        console.log(`Found ${documents.length} documents`);
        
        const result = documents.map((doc: any) => ({
          name: doc.name,
          displayName: doc.displayName || doc.name?.split("/").pop() || "Untitled Document",
          customMetadata: doc.customMetadata || [],
        }));

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'upload': {
        if (!storeName) throw new Error("storeName required for upload");
        if (!formData) throw new Error("FormData required for upload");
        
        const file = formData.get('file');
        const displayName = formData.get('displayName') as string;
        
        if (!file) throw new Error("No file provided");

        console.log('Starting file upload for store:', storeName);

        const ai = getAiClient();
        
        // Step 1: Upload to Files API using SDK
        const fileBuffer = await (file as File).arrayBuffer();
        const fileBlob = new Blob([fileBuffer], { type: (file as File).type });
        
        const uploadedFile = await ai.files.upload({
          file: fileBlob,
          config: { 
            name: displayName || (file as File).name,
          },
        });

        console.log('File uploaded:', uploadedFile.name);

        // Step 2: Import into the store
        const importOperation = await ai.fileSearchStores.importFile({
          fileSearchStoreName: storeName,
          fileName: uploadedFile.name,
        });

        console.log('Import operation:', importOperation.name);

        // Wait for import operation to complete
        let attempts = 0;
        let operation = importOperation;
        while (!operation.done && attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const opName = operation.name.split('/').pop();
          operation = await ai.operations.get({ name: operation.name });
          attempts++;
          console.log(`Import operation check ${attempts}:`, operation.done ? 'done' : 'processing');
        }

        if (operation.error) {
          console.error('Import operation failed:', operation.error);
          throw new Error(`Import failed: ${JSON.stringify(operation.error)}`);
        }

        console.log('Import completed successfully');

        return new Response(JSON.stringify({ success: true, fileName: uploadedFile.name }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!documentName) throw new Error("documentName required for delete");
        
        console.log('Deleting document:', documentName);
        
        const response = await fetch(
          `${GEMINI_API_BASE}/${documentName}?force=true&key=${GEMINI_API_KEY}`,
          { method: 'DELETE' }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Delete failed:', errorText);
          throw new Error(`Gemini API error: ${errorText}`);
        }

        console.log('Document deleted successfully');

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in gemini-document-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
