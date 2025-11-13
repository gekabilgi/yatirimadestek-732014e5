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

    const { operation, storeName, displayName } = await req.json();

    switch (operation) {
      case 'list': {
        // List file search stores; fallback to provided default store if listing fails
        const DEFAULT_STORE = 'fileSearchStores/aicb-xehflr037liz';
        try {
          const response = await fetch(
            `${GEMINI_API_BASE}/fileSearchStores?key=${GEMINI_API_KEY}`,
            { method: 'GET' }
          );

          if (!response.ok) {
            // Fallback to default store when listing is not available
            return new Response(JSON.stringify([
              { name: DEFAULT_STORE, displayName: 'Default File Search Store' },
            ]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }

          const data = await response.json();
          const stores = data.fileSearchStores || [];

          // If API returns empty, still provide the default store
          const result = (stores.length ? stores : [ { name: DEFAULT_STORE, displayName: 'Default File Search Store' } ])
            .map((store: any) => ({
              name: store.name,
              displayName: store.displayName || store.name?.split("/").pop() || "Untitled Store",
            }));

          return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (_) {
          // Network or other errors -> fallback
          return new Response(JSON.stringify([
            { name: DEFAULT_STORE, displayName: 'Default File Search Store' },
          ]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      case 'create': {
        if (!displayName) throw new Error("displayName required for create");
        
        const response = await fetch(
          `${GEMINI_API_BASE}/fileSearchStores?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${errorText}`);
        }

        const store = await response.json();

        return new Response(JSON.stringify({ 
          name: store.name, 
          displayName: store.displayName 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!storeName) throw new Error("storeName required for delete");
        
        console.log('Starting cascade delete for store:', storeName);
        
        try {
          // Step 1: List all documents in the store
          const listResponse = await fetch(
            `${GEMINI_API_BASE}/${storeName}/documents?key=${GEMINI_API_KEY}`,
            { method: 'GET' }
          );

          if (listResponse.ok) {
            const data = await listResponse.json();
            const documents = data.documents || [];
            
            console.log(`Found ${documents.length} documents to delete`);
            
            // Step 2: Delete all documents
            for (const doc of documents) {
              console.log('Deleting document:', doc.name);
              const deleteDocResponse = await fetch(
                `${GEMINI_API_BASE}/${doc.name}?force=true&key=${GEMINI_API_KEY}`,
                { method: 'DELETE' }
              );
              
              if (!deleteDocResponse.ok) {
                const errorText = await deleteDocResponse.text();
                console.error('Failed to delete document:', doc.name, errorText);
                // Continue anyway to try to delete other documents
              }
            }
          }
          
          // Step 3: Now delete the empty store
          console.log('Deleting store:', storeName);
          const response = await fetch(
            `${GEMINI_API_BASE}/${storeName}?key=${GEMINI_API_KEY}`,
            { method: 'DELETE' }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Store delete failed:', errorText);
            throw new Error(`Gemini API error: ${errorText}`);
          }

          console.log('Store deleted successfully');
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (error) {
          console.error('Cascade delete error:', error);
          throw error;
        }
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error('Error in gemini-store-operations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
