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

        // Step 1: Upload file using Gemini Files API
        const fileBuffer = await (file as File).arrayBuffer();
        const fileSize = fileBuffer.byteLength;
        const mimeType = (file as File).type || 'application/octet-stream';
        
        // Create metadata
        const metadata = {
          file: {
            display_name: displayName || (file as File).name,
          }
        };

        // Initial upload request to get upload URL
        const initResponse = await fetch(
          `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'X-Goog-Upload-Protocol': 'resumable',
              'X-Goog-Upload-Command': 'start',
              'X-Goog-Upload-Header-Content-Length': fileSize.toString(),
              'X-Goog-Upload-Header-Content-Type': mimeType,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          }
        );

        if (!initResponse.ok) {
          const errorText = await initResponse.text();
          console.error('Upload init failed:', initResponse.status, errorText);
          throw new Error(`Upload init error: ${errorText}`);
        }

        const uploadUrl = initResponse.headers.get('x-goog-upload-url');
        if (!uploadUrl) {
          throw new Error('No upload URL returned');
        }

        console.log('Got upload URL, uploading file...');

        // Upload the actual file
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Length': fileSize.toString(),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize',
          },
          body: fileBuffer,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('File upload failed:', uploadResponse.status, errorText);
          throw new Error(`File upload error: ${errorText}`);
        }

        const uploadedFile = await uploadResponse.json();
        console.log('File uploaded:', uploadedFile.file?.name);

        // Step 2: Import into the store via REST API (SDK fileSearchStores not available in this env)
        const importResp = await fetch(
          `${GEMINI_API_BASE}/${storeName}:import?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: uploadedFile.file.name }),
          }
        );

        if (!importResp.ok) {
          const t = await importResp.text();
          console.error('Import start failed:', importResp.status, t);
          throw new Error(`Import start error: ${t}`);
        }

        let operation = await importResp.json();
        console.log('Import operation started:', operation.name);

        // Wait for import to complete
        let attempts = 0;
        while (!operation.done && attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const poll = await fetch(`${GEMINI_API_BASE}/${operation.name}?key=${GEMINI_API_KEY}`);
          if (!poll.ok) {
            const pt = await poll.text();
            console.error('Import poll failed:', poll.status, pt);
            throw new Error(`Import poll error: ${pt}`);
          }
          operation = await poll.json();
          attempts++;
          console.log(`Import check ${attempts}:`, operation.done ? 'done' : 'processing');
        }

        if (operation.error) {
          console.error('Import failed:', operation.error);
          throw new Error(`Import failed: ${JSON.stringify(operation.error)}`);
        }

        console.log('Import completed successfully');

        return new Response(JSON.stringify({ success: true, fileName: uploadedFile.file.name }), {
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
