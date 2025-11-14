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

        if (!file) throw new Error("No file provided");

        const normalizedStoreName =
          storeName && storeName.startsWith("fileSearchStores/") ? storeName : `fileSearchStores/${storeName}`;

        console.log("🔵 Starting TWO-STEP upload process for store:", normalizedStoreName);

        const fileBuffer = await (file as File).arrayBuffer();
        const fileName = (file as File).name;
        const mimeType = (file as File).type || "application/octet-stream";
        const finalDisplayName = displayName || fileName;

        // Prepare metadata including fileName
        const metadata = [
          { key: "fileName", stringValue: finalDisplayName },
          { key: "uploadDate", stringValue: new Date().toISOString() },
        ];

        console.log("🔵 STEP 1: Prepared metadata:", JSON.stringify(metadata, null, 2));
        console.log("🔵 File name:", fileName);
        console.log("🔵 Display name:", finalDisplayName);

        // STEP 1: Upload to Files API
        console.log("🟢 STEP 2: Uploading to Files API...");
        const encodedFileName = encodeURIComponent(fileName);
        const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "X-Goog-Upload-Protocol": "raw",
            "X-Goog-Upload-File-Name": encodedFileName,
            "Content-Type": mimeType,
          },
          body: fileBuffer,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Files API upload failed: ${errorText}`);
        }

        const uploadText = await uploadResponse.text();
        const uploadedFile = uploadText ? JSON.parse(uploadText) : {};
        const fileResourceName = uploadedFile.name || uploadedFile?.file?.name;

        if (!fileResourceName) {
          throw new Error("Upload did not return a file resource name");
        }

        console.log("🟢 STEP 3: File uploaded to Files API:", fileResourceName);

        // STEP 2: Set display name on the uploaded file
        const patchFileUrl = `${GEMINI_API_BASE}/${fileResourceName}?key=${GEMINI_API_KEY}&updateMask=displayName`;
        const patchFileResponse = await fetch(patchFileUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: finalDisplayName }),
        });

        if (!patchFileResponse.ok) {
          console.warn("⚠️ Failed to set displayName on file, continuing anyway");
        } else {
          console.log("🟢 STEP 4: Display name set on file");
        }

        // STEP 3: Import file into store WITH metadata (try multiple RPCs)
        console.log("🟡 STEP 5: Importing file into store with metadata...");

        let importOp: any | undefined;

        // Attempt 1: importFile (singular RPC)
        const importFileUrl = `${GEMINI_API_BASE}/${normalizedStoreName}:importFile?key=${GEMINI_API_KEY}`;
        const importFilePayload = {
          file: fileResourceName,
          config: {
            displayName: finalDisplayName,
            customMetadata: toGeminiMetadata(metadata),
          },
        };
        console.log("🟡 Trying importFile RPC:", JSON.stringify(importFilePayload, null, 2));
        let resp = await fetch(importFileUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importFilePayload),
        });
        let status = resp.status;
        let text = resp.ok ? "" : await resp.text();
        if (!resp.ok) {
          console.warn("⚠️ importFile failed:", status, text || "No body");

          // Attempt 2: documents:import (with fileName)
          const documentsImportUrl = `${GEMINI_API_BASE}/${normalizedStoreName}/documents:import?key=${GEMINI_API_KEY}`;
          const documentsImportPayload = {
            fileName: fileResourceName,
            config: {
              displayName: finalDisplayName,
              customMetadata: toGeminiMetadata(metadata),
            },
          };
          console.log("🟡 Trying documents:import:", JSON.stringify(documentsImportPayload, null, 2));
          resp = await fetch(documentsImportUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(documentsImportPayload),
          });
          status = resp.status;
          text = resp.ok ? "" : await resp.text();
          if (!resp.ok) {
            console.warn("⚠️ documents:import failed:", status, text || "No body");

            // Attempt 3: importFiles (batch RPC)
            const importFilesUrl = `${GEMINI_API_BASE}/${normalizedStoreName}:importFiles?key=${GEMINI_API_KEY}`;
            const importFilesPayload = {
              files: [
                {
                  file: fileResourceName,
                  config: {
                    displayName: finalDisplayName,
                    customMetadata: toGeminiMetadata(metadata),
                  },
                },
              ],
            };
            console.log("🟡 Trying importFiles RPC:", JSON.stringify(importFilesPayload, null, 2));
            resp = await fetch(importFilesUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(importFilesPayload),
            });
            status = resp.status;
            text = resp.ok ? "" : await resp.text();
            if (!resp.ok) {
              console.error("❌ All import attempts failed.");
              throw new Error(
                `Import failed. importFile=${status} ${text || 'No body'}; documents:import failed earlier; importFiles failed too.`,
              );
            }
          }
        }
        importOp = await resp.json();

        console.log("🟡 STEP 6: Import operation started:", importOp.name || importOp?.operation || importOp);

        // STEP 4: Poll the operation until complete
        let operation = importOp;
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes max

        while (!operation.done && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const pollResponse = await fetch(`${GEMINI_API_BASE}/${operation.name}?key=${GEMINI_API_KEY}`, {
            method: "GET",
          });

          if (!pollResponse.ok) {
            throw new Error("Failed to poll operation status");
          }

          operation = await pollResponse.json();
          attempts++;
          console.log(`🔄 Polling attempt ${attempts}: done=${operation.done}`);
        }

        if (!operation.done) {
          throw new Error("Import operation timed out");
        }

        if (operation.error) {
          throw new Error(`Import operation failed: ${JSON.stringify(operation.error)}`);
        }

        console.log("✅ STEP 7: Import completed successfully!");
        console.log("✅ Document should now have customMetadata set");

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
