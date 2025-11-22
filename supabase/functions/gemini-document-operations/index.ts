import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI, CustomMetadata } from "npm:@google/genai@1.29.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getAiClient(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

function toGeminiMetadata(meta?: { key: string; stringValue: string }[]): CustomMetadata[] | undefined {
  const arr = (meta ?? [])
    .filter((m) => m.key && m.key.trim())
    .map((m) => ({
      key: m.key!.trim(),
      stringValue: m.stringValue?.trim() ?? "",
    }));
  return arr.length ? arr : undefined;
}

// Removed patchDocumentMetadata - metadata is now set during import

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");

    console.log("gemini-document-operations: Processing request");

    // Check content type to determine how to parse request
    const contentType = req.headers.get("content-type") || "";
    let operation, storeName, documentName, formData;

    if (contentType.includes("multipart/form-data")) {
      // For file uploads - parse formData once
      formData = await req.formData();
      operation = formData.get("operation") as string;
      storeName = formData.get("storeName") as string;
      documentName = formData.get("documentName") as string;
    } else {
      // For JSON requests
      const body = await req.json();
      operation = body.operation;
      storeName = body.storeName;
      documentName = body.documentName;
    }

    switch (operation) {
      case "list": {
        if (!storeName) throw new Error("storeName required for list");

        console.log("Listing documents for store:", storeName);

        const normalizedStoreName = storeName.startsWith("fileSearchStores/")
          ? storeName
          : `fileSearchStores/${storeName}`;

        // Fetch all documents with pagination
        let allDocuments: any[] = [];
        let pageToken: string | undefined = undefined;

        do {
          const url = new URL(`${GEMINI_API_BASE}/${normalizedStoreName}/documents`);
          url.searchParams.set("key", GEMINI_API_KEY);
          url.searchParams.set("pageSize", "20"); // Gemini API max is 20
          if (pageToken) {
            url.searchParams.set("pageToken", pageToken);
          }

          const response = await fetch(url.toString(), { method: "GET" });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("List documents failed:", errorText);
            throw new Error(`Gemini API error: ${errorText}`);
          }

          const data = await response.json();
          const documents = data.documents || [];
          allDocuments = allDocuments.concat(documents);
          pageToken = data.nextPageToken;

          console.log(`Fetched ${documents.length} documents (total: ${allDocuments.length})`);
        } while (pageToken);

        console.log(`Found ${allDocuments.length} total documents`);

        const result = allDocuments.map((doc: any) => {
          console.log("📄 Document from Gemini API:", {
            name: doc.name,
            displayName: doc.displayName,
            customMetadata: doc.customMetadata,
          });

          // Parse customMetadata correctly - API may return 'value' or 'stringValue'
          const parsedMetadata = (doc.customMetadata || []).map((m: any) => {
            console.log("📋 Parsing metadata item:", { key: m.key, stringValue: m.stringValue, value: m.value });
            return {
              key: m.key,
              stringValue: typeof m.stringValue === "string" ? m.stringValue : (m.value ?? ""),
            };
          });

          console.log("📋 Parsed metadata:", parsedMetadata);

          return {
            name: doc.name,
            displayName: doc.displayName || doc.name?.split("/").pop() || "Untitled Document",
            customMetadata: parsedMetadata,
            createTime: doc.createTime,
            sizeBytes: doc.sizeBytes,
          };
        });

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload": {
        if (!storeName) throw new Error("storeName required for upload");
        if (!formData) throw new Error("FormData required for upload");

        const file = formData.get("file");
        const displayName = formData.get("displayName") as string;
        const customMetadataStr = formData.get("customMetadata") as string;

        if (!file) throw new Error("No file provided");

        const normalizedStoreName =
          storeName && storeName.startsWith("fileSearchStores/") ? storeName : `fileSearchStores/${storeName}`;

        console.log("🔵 Starting TWO-STEP upload process for store:", normalizedStoreName);

        const fileBuffer = await (file as File).arrayBuffer();
        const fileName = (file as File).name;
        const mimeType = (file as File).type || "application/octet-stream";
        const finalDisplayName = displayName || fileName;

        // Parse custom metadata first to check for existing "Dosya" key
        let customMeta: { key: string; stringValue: string }[] = [];
        if (customMetadataStr) {
          try {
            const parsed = JSON.parse(customMetadataStr);
            if (Array.isArray(parsed)) {
              customMeta = parsed.filter(m => m.key && m.key.trim());
            }
          } catch (e) {
            console.warn("Failed to parse customMetadata:", e);
          }
        }

        // Check if "Dosya" already exists in custom metadata
        const hasDosyaKey = customMeta.some(m => m.key === "Dosya");

        // Prepare metadata including fileName and custom metadata
        const metadata: { key: string; stringValue: string }[] = [
          { key: "fileName", stringValue: finalDisplayName },
          { key: "uploadDate", stringValue: new Date().toISOString() },
        ];

        // Only add automatic "Dosya" if user didn't already provide it
        if (!hasDosyaKey) {
          metadata.push({ key: "Dosya", stringValue: finalDisplayName });
        }

        // Add user's custom metadata
        metadata.push(...customMeta);

        console.log("🔵 STEP 1: Prepared metadata:", JSON.stringify(metadata, null, 2));
        console.log("🔵 File name:", fileName);
        console.log("🔵 Display name:", finalDisplayName);

        // Filter out internal-only metadata (fileName, uploadDate)
        // Keep "Dosya" and other custom metadata for Gemini
        const customOnlyMetadata = metadata.filter(m => 
          m.key !== 'fileName' && m.key !== 'uploadDate'
        );
        const geminiMetadata = toGeminiMetadata(customOnlyMetadata);

        console.log("🟢 Using SDK uploadToFileSearchStore with metadata:", {
          finalDisplayName,
          customMetadata: geminiMetadata,
        });

        // Use SDK to upload directly to store with metadata
        const ai = getAiClient();
        
        // Create a File object from the buffer for the SDK
        const fileBlob = new Blob([fileBuffer], { type: mimeType });
        const fileForSdk = new File([fileBlob], fileName, { type: mimeType });

        let op = await ai.fileSearchStores.uploadToFileSearchStore({
          file: fileForSdk,
          fileSearchStoreName: normalizedStoreName,
          config: {
            displayName: finalDisplayName,
            customMetadata: geminiMetadata,
          },
        });

        if (!op) {
          throw new Error("Upload operation failed to start");
        }
        const operationName = typeof op === 'string' ? op : op.name;
        console.log("🟡 Upload operation started:", operationName);

        // Poll operation until complete
        let attempts = 0;
        const maxAttempts = 60;
        let isDone = false;
        
        while (!isDone && attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 3000));

          // Poll operation status via REST to avoid SDK param issues
          const url = new URL(`${GEMINI_API_BASE}/${operationName}`);
          url.searchParams.set("key", GEMINI_API_KEY!);
          const statusResp = await fetch(url.toString(), { method: "GET" });
          if (!statusResp.ok) {
            const t = await statusResp.text();
            console.error("Operation status fetch failed:", t);
            throw new Error(`Operation status error: ${t}`);
          }

          const opStatus: any = await statusResp.json();
          isDone = !!opStatus.done;
          attempts++;
          console.log(`🔄 Polling attempt ${attempts}: done=${isDone}`);

          if (isDone && opStatus.error) {
            throw new Error(`Upload operation failed: ${JSON.stringify(opStatus.error)}`);
          }
        }

        if (!isDone) {
          throw new Error("Upload operation timed out");
        }

        console.log("✅ Upload completed successfully!");
        console.log("✅ Document created with displayName and customMetadata");

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!documentName) throw new Error("documentName required for delete");

        console.log("Deleting document:", documentName);

        const deleteResponse = await fetch(
          `${GEMINI_API_BASE}/${documentName}?force=true&key=${GEMINI_API_KEY}`,
          { method: "DELETE" }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.error("Delete document failed:", errorText);
          throw new Error(`Gemini API error: ${errorText}`);
        }

        console.log("Document deleted successfully");
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Error in gemini-document-operations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
