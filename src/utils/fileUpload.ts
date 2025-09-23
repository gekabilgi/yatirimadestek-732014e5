
import { supabase } from '@/integrations/supabase/client';

export const uploadProgramFiles = async (files: File[], programId: string) => {
  const uploadedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Create a unique filename to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `${programId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('program-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('program-files')
        .getPublicUrl(fileName);

      // Save file reference to database with display order
      const { data: fileData, error: dbError } = await supabase
        .from('file_attachments')
        .insert({
          support_program_id: programId,
          filename: file.name,
          file_url: publicUrl,
          display_order: i + 1, // Preserve the order from the files array
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving file reference:', dbError);
        throw dbError;
      }

      uploadedFiles.push(fileData);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  return uploadedFiles;
};

export const uploadLegislationFiles = async (files: File[]) => {
  const uploadedFiles = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Create a unique filename to avoid conflicts
      const fileExt = file.name.split('.').pop();
      const fileName = `legislation/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('program-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('program-files')
        .getPublicUrl(fileName);

      uploadedFiles.push({
        filename: file.name,
        file_url: publicUrl,
        display_order: i + 1
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw error;
    }
  }

  return uploadedFiles;
};

export const deleteFileFromStorage = async (fileUrl: string) => {
  try {
    // Extract the file path from the URL
    const urlParts = fileUrl.split('/program-files/');
    if (urlParts.length < 2) return;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from('program-files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file from storage:', error);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
