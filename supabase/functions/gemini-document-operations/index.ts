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
        
        const normalizedStoreName = storeName.startsWith('fileSearchStores/') ? storeName : `fileSearchStores/${storeName}`;
        
        // Fetch all documents with pagination
        let allDocuments: any[] = [];
        let pageToken: string | undefined = undefined;
        
        do {
          const url = new URL(`${GEMINI_API_BASE}/${normalizedStoreName}/documents`);
          url.searchParams.set('key', GEMINI_API_KEY);
          url.searchParams.set('pageSize', '20'); // Gemini API max is 20
          if (pageToken) {
            url.searchParams.set('pageToken', pageToken);
          }
          
          const response = await fetch(url.toString(), { method: 'GET' });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('List documents failed:', errorText);
            throw new Error(`Gemini API error: ${errorText}`);
          }

          const data = await response.json();
          const documents = data.documents || [];
          allDocuments = allDocuments.concat(documents);
          pageToken = data.nextPageToken;
          
          console.log(`Fetched ${documents.length} documents (total: ${allDocuments.length})`);
        } while (pageToken);
        
        console.log(`Found ${allDocuments.length} total documents`);
        
        const result = allDocuments.map((doc: any) => ({
          name: doc.name,
          displayName: doc.displayName || doc.name?.split("/").pop() || "Untitled Document",
          customMetadata: doc.customMetadata || [],
          createTime: doc.createTime,
          sizeBytes: doc.sizeBytes,
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

        // Normalize store name to required prefix
        const normalizedStoreName = storeName && storeName.startsWith('fileSearchStores/') ? storeName : `fileSearchStores/${storeName}`;
        console.log('Starting file upload for store:', normalizedStoreName);

        // Try ONE-STEP upload via SDK first; fall back to RAW+import if it fails
        try {
          const ai = getAiClient();
          const finalDisplayName = (displayName as string) || ((file as File).name || 'uploaded-file');
          const op: any = await (ai as any).fileSearchStores.uploadToFileSearchStore({
            file: file as File,
            fileSearchStoreName: normalizedStoreName,
            config: {
              displayName: finalDisplayName,
            },
          });

          const sdkOperationName = op?.name;
          console.log('SDK upload started:', sdkOperationName);

          // Poll operation until done
          if (sdkOperationName) {
            let attempts = 0; let done = false;
            while (!done && attempts < 30) {
              await new Promise(r => setTimeout(r, 3000));
              const opResp = await fetch(`${GEMINI_API_BASE}/${sdkOperationName}?key=${GEMINI_API_KEY}`, { method: 'GET' });
              if (!opResp.ok) {
                const t = await opResp.text();
                console.error('SDK operation check failed:', t);
                throw new Error(`SDK operation check failed: ${t}`);
              }
              const opData = await opResp.json();
              done = opData.done === true;
              attempts++;
              console.log(`SDK import check ${attempts}:`, done ? 'done' : 'processing');
              if (opData.error) {
                console.error('SDK import failed:', opData.error);
                throw new Error(`SDK import failed: ${JSON.stringify(opData.error)}`);
              }
            }
          }

          console.log('Upload completed successfully via SDK');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (sdkErr) {
          console.warn('SDK upload failed, falling back to RAW upload:', sdkErr && (sdkErr as any).message ? (sdkErr as any).message : sdkErr);
        }

        const fileBuffer = await (file as File).arrayBuffer();
        const fileName = (file as File).name;
        const mimeType = (file as File).type || 'application/octet-stream';

        // Step 1: Upload file bytes to Gemini Files API using RAW protocol (works reliably in Deno)
        // IMPORTANT: Encode filename to ASCII for HTTP header (fixes ByteString error with Turkish chars)
        const encodedFileName = encodeURIComponent(fileName);
        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Protocol': 'raw',
            'X-Goog-Upload-File-Name': encodedFileName,
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
        // Step 2: Import file into store (try primary endpoint, then fallback to alternate RPC if needed)
        let importData: any | undefined;

        const primaryImportUrl = `${GEMINI_API_BASE}/${normalizedStoreName}/documents:import?key=${GEMINI_API_KEY}`;
        const primaryPayload = { fileName: fileResourceName };
        console.log('Importing file into store using documents:import', { storeName: normalizedStoreName, fileResourceName });

        let importResponse = await fetch(primaryImportUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(primaryPayload),
        });

        if (!importResponse.ok) {
          const errorText = await importResponse.text();
          console.error('Import failed with status:', importResponse.status);
          console.error('Import error response:', errorText);
          console.error('Import request was for file:', fileResourceName, 'to store:', storeName);

          if (importResponse.status === 404) {
            // Some environments expose an alternate RPC for FileSearch stores
             const altImportUrl = `${GEMINI_API_BASE}/${normalizedStoreName}:importFiles?key=${GEMINI_API_KEY}`;
             const altPayload = { files: [{ file: fileResourceName }] };
            console.warn('Primary import 404. Trying alternate import RPC importFiles', { altImportUrl });

            const altResp = await fetch(altImportUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(altPayload),
            });

            if (!altResp.ok) {
              const altText = await altResp.text();
              console.error('Alternate import (importFiles) failed with status:', altResp.status);
              console.error('Alternate import error response:', altText);
              throw new Error(`Import failed after fallback. documents:import(${importResponse.status}) -> importFiles(${altResp.status})`);
            }

            importData = await altResp.json();
          } else {
            throw new Error(`Import failed (${importResponse.status}): ${errorText || 'No error details'}`);
          }
        } else {
          importData = await importResponse.json();
        }


        // Note: legacy importResponse error handling block removed due to new fallback logic above

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
