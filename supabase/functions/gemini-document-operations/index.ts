import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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

        // First, upload file to Files API
        const fileBuffer = await (file as File).arrayBuffer();
        const fileBlob = new Blob([fileBuffer], { type: (file as File).type });
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', fileBlob, (file as File).name);

        const uploadResponse = await fetch(
          `${GEMINI_API_BASE}/files?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('File upload failed:', errorText);
          throw new Error(`File upload error: ${errorText}`);
        }

        const uploadedFile = await uploadResponse.json();
        console.log('File uploaded, waiting for processing:', uploadedFile.name);

        // Wait for file to be processed
        let fileData = uploadedFile;
        let attempts = 0;
        while (fileData.state === 'PROCESSING' && attempts < 30) {
          await new Promise(r => setTimeout(r, 2000));
          const checkResponse = await fetch(
            `${GEMINI_API_BASE}/files/${fileData.name.split('/').pop()}?key=${GEMINI_API_KEY}`,
            { method: 'GET' }
          );
          fileData = await checkResponse.json();
          attempts++;
          console.log(`File processing check ${attempts}:`, fileData.state);
        }

        if (fileData.state === 'FAILED') {
          throw new Error('File processing failed');
        }

        console.log('File processed successfully, importing to store');

        // Import file to file search store
        const importResponse = await fetch(
          `${GEMINI_API_BASE}/${storeName}:importFile?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: fileData.name,
              displayName: displayName || (file as File).name,
            }),
          }
        );

        if (!importResponse.ok) {
          const errorText = await importResponse.text();
          console.error('Import failed:', errorText);
          throw new Error(`Import error: ${errorText}`);
        }

        const operation = await importResponse.json();
        console.log('Import operation started:', operation.name);

        return new Response(JSON.stringify({ success: true, operation: operation.name }), {
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
