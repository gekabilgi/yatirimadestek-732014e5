import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, FileState } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAiClient(): GoogleGenerativeAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenerativeAI(apiKey);
}

function basenameSafe(p: string): string {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

async function waitForFile(ai: GoogleGenerativeAI, fileName: string): Promise<void> {
  let file = await ai.files.get(fileName);
  while (file.state === FileState.PROCESSING) {
    await new Promise(r => setTimeout(r, 3000));
    file = await ai.files.get(fileName);
  }
  if (file.state === FileState.FAILED) {
    throw new Error("File processing failed");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, storeName, documentName } = await req.json();
    const ai = getAiClient();

    switch (operation) {
      case 'list': {
        if (!storeName) throw new Error("storeName required for list");
        
        // List documents in corpus
        const documents = await ai.corpora.documents.list(storeName);
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
        
        const formData = await req.formData();
        const file = formData.get('file');
        const displayName = formData.get('displayName') as string;
        
        if (!file) throw new Error("No file provided");

        // Upload file to Gemini Files API
        const fileBuffer = await (file as File).arrayBuffer();
        const uploadedFile = await ai.files.upload({
          file: {
            data: new Uint8Array(fileBuffer),
            mimeType: (file as File).type,
          },
          config: {
            displayName: displayName || (file as File).name,
          },
        });

        // Wait for file processing
        await waitForFile(ai, uploadedFile.name);

        // Create document in corpus
        await ai.corpora.documents.create(storeName, {
          displayName: displayName || (file as File).name,
          parts: [{
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            },
          }],
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!documentName) throw new Error("documentName required for delete");
        
        await ai.corpora.documents.delete(documentName);

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
