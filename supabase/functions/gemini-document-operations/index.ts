import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getAiClient(): GoogleGenAI {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

function basenameSafe(p: string): string {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
}

async function waitForOperation(ai: GoogleGenAI, op: any, pollMs = 3000): Promise<void> {
  while (!op?.done) {
    await new Promise(r => setTimeout(r, pollMs));
    op = await ai.operations.get({ operation: op });
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
        
        const pager = await ai.fileSearchStores.documents.list({ parent: storeName });
        const docs: any[] = [];
        for await (const d of pager) docs.push(d);

        const result = docs.map((doc: any) => {
          const title =
            doc.displayName ||
            doc.file?.displayName ||
            (doc.file?.uri ? basenameSafe(doc.file.uri) : "") ||
            "Untitled Document";
          
          return {
            name: doc.name,
            displayName: title,
            customMetadata: (doc.customMetadata || []).map((m: any) => ({
              key: m.key,
              stringValue: typeof m.stringValue === "string" ? m.stringValue : m.value ?? "",
            })),
          };
        });

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

        // Convert file to buffer for Gemini
        const fileBuffer = await (file as File).arrayBuffer();
        const fileBlob = new Blob([fileBuffer], { type: (file as File).type });

        const op = await ai.fileSearchStores.uploadToFileSearchStore({
          file: fileBlob as any,
          fileSearchStoreName: storeName,
          config: {
            displayName: displayName || (file as File).name,
          },
        });

        await waitForOperation(ai, op);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!documentName) throw new Error("documentName required for delete");
        
        await ai.fileSearchStores.documents.delete({ name: documentName });

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
