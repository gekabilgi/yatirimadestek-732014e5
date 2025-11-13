import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@1.29.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getAiClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    
    console.log('gemini-document-operations: Processing request');

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

        const fileBuffer = await (file as File).arrayBuffer();
        const fileName = (file as File).name;
        const mimeType = (file as File).type || 'application/octet-stream';

        // Step 1: Upload file bytes to Gemini Files API using RAW protocol (works reliably in Deno)
        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'raw',
            'X-Goog-Upload-File-Name': fileName,
            'Content-Type': mimeType,
          },
          body: fileBuffer,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('File upload failed:', errorText);
          throw new Error(`File upload failed: ${errorText}`);
        }

        // Some environments return empty body on .json(); safely parse text
        const uploadText = await uploadResponse.text();
        let uploadData: any;
        try {
          uploadData = uploadText ? JSON.parse(uploadText) : {};
        } catch (e) {
          console.error('Invalid JSON in upload response:', uploadText);
          throw new Error('Upload returned invalid JSON');
        }

        const fileResourceName = uploadData.name || uploadData?.file?.name;
        if (!fileResourceName) {
          console.error('No file resource name in response:', uploadData);
          throw new Error('Upload did not return a file resource name');
        }
        console.log('File uploaded:', fileResourceName, 'displayName:', displayName || fileName);

        // Step 2: Import file into store
        const importResponse = await fetch(
          `${GEMINI_API_BASE}/${storeName}/documents:import?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: fileResourceName,
              // Persist original filename for UI display
              customMetadata: [
                { key: 'fileName', stringValue: (displayName || fileName) }
              ],
              chunkingConfig: {
                whiteSpaceConfig: {
                  maxTokensPerChunk: 200,
                  maxOverlapTokens: 20
                }
              }
            })
          }
        );

        if (!importResponse.ok) {
          const errorText = await importResponse.text();
          console.error('Import failed:', errorText);
          throw new Error(`Import failed: ${errorText}`);
        }

        const importData = await importResponse.json();
        const operationName = importData.name;
        console.log('Import operation started:', operationName);

        // Step 3: Poll for operation completion
        let attempts = 0;
        let operationComplete = false;
        
        while (!operationComplete && attempts < 30) {
          await new Promise(r => setTimeout(r, 3000));
          
          const opResponse = await fetch(
            `${GEMINI_API_BASE}/${operationName}?key=${GEMINI_API_KEY}`,
            { method: 'GET' }
          );

          if (!opResponse.ok) {
            const errorText = await opResponse.text();
            console.error('Operation check failed:', errorText);
            throw new Error(`Operation check failed: ${errorText}`);
          }

          const opData = await opResponse.json();
          operationComplete = opData.done === true;
          attempts++;
          console.log(`Import check ${attempts}:`, operationComplete ? 'done' : 'processing');

          if (opData.error) {
            console.error('Import failed:', opData.error);
            throw new Error(`Import failed: ${JSON.stringify(opData.error)}`);
          }
        }

        console.log('Upload completed successfully');

        return new Response(JSON.stringify({ success: true }), {
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
