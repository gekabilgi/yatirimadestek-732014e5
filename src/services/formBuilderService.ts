import { supabase } from "@/integrations/supabase/client";
import type { FormTemplate, FormField, FormSubmission, FormSettings, FormBranding } from "@/types/formBuilder";
import type { FormTemplatePreset } from "@/data/formTemplatePresets";
import type { Json } from "@/integrations/supabase/types";

// Helper to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Create form from preset template
export const createFormFromTemplate = async (preset: FormTemplatePreset, formName: string): Promise<FormTemplate> => {
  const slug = generateSlug(formName) + '-' + Date.now();
  
  const { data: formData, error: formError } = await supabase
    .from('form_templates')
    .insert([{
      name: formName,
      description: preset.description,
      slug,
      is_active: false,
      is_public: true,
      display_mode: 'standalone',
      branding: preset.branding as Json,
    }])
    .select()
    .single();

  if (formError) throw formError;
  
  // Create fields from preset
  for (const field of preset.fields) {
    await supabase.from('form_fields').insert([{
      form_id: formData.id,
      name: field.name,
      label: field.label,
      field_type: field.field_type,
      is_required: field.is_required,
      display_order: field.display_order,
      placeholder: field.placeholder || null,
      help_text: field.help_text || null,
      options: (field.options || []) as unknown as Json,
      validation_rules: (field.validation_rules || {}) as unknown as Json,
    }]);
  }

  return formData as unknown as FormTemplate;
};

// Form Templates
export const fetchFormTemplates = async (): Promise<FormTemplate[]> => {
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as FormTemplate[];
};

export const fetchFormTemplate = async (id: string): Promise<FormTemplate | null> => {
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as FormTemplate;
};

export const fetchFormTemplateBySlug = async (slug: string): Promise<FormTemplate | null> => {
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as unknown as FormTemplate;
};

export const createFormTemplate = async (
  name: string,
  description?: string
): Promise<FormTemplate> => {
  const slug = generateSlug(name) + '-' + Date.now().toString(36);
  
  const { data, error } = await supabase
    .from('form_templates')
    .insert({
      name,
      slug,
      description,
      is_active: false,
      is_public: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as FormTemplate;
};

export const updateFormTemplate = async (
  id: string,
  updates: Partial<Pick<FormTemplate, 'name' | 'description' | 'is_active' | 'is_public' | 'settings' | 'display_mode' | 'branding'>>
): Promise<FormTemplate> => {
  const dbUpdates: Record<string, any> = { ...updates };
  if (updates.settings) {
    dbUpdates.settings = updates.settings as any;
  }
  if (updates.branding) {
    dbUpdates.branding = updates.branding as any;
  }
  
  const { data, error } = await supabase
    .from('form_templates')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as FormTemplate;
};

export const deleteFormTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('form_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const duplicateFormTemplate = async (id: string): Promise<FormTemplate> => {
  // Fetch original template and fields
  const original = await fetchFormTemplate(id);
  if (!original) throw new Error('Form not found');

  const fields = await fetchFormFields(id);

  // Create new template
  const newTemplate = await createFormTemplate(
    original.name + ' (Kopya)',
    original.description
  );

  // Copy fields
  if (fields.length > 0) {
    const newFields = fields.map(field => ({
      form_id: newTemplate.id,
      field_type: field.field_type,
      label: field.label,
      name: field.name,
      placeholder: field.placeholder,
      help_text: field.help_text,
      is_required: field.is_required,
      display_order: field.display_order,
      options: field.options as any,
      validation_rules: field.validation_rules as any,
      conditional_logic: field.conditional_logic as any,
    }));

    const { error } = await supabase
      .from('form_fields')
      .insert(newFields as any);

    if (error) throw error;
  }

  return newTemplate;
};

// Form Fields
export const fetchFormFields = async (formId: string): Promise<FormField[]> => {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', formId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as FormField[];
};

export const createFormField = async (
  formId: string,
  field: Omit<FormField, 'id' | 'form_id' | 'created_at' | 'updated_at'>
): Promise<FormField> => {
  const { data, error } = await supabase
    .from('form_fields')
    .insert({
      form_id: formId,
      field_type: field.field_type,
      label: field.label,
      name: field.name,
      placeholder: field.placeholder,
      help_text: field.help_text,
      is_required: field.is_required,
      display_order: field.display_order,
      options: field.options as any,
      validation_rules: field.validation_rules as any,
      conditional_logic: field.conditional_logic as any,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as FormField;
};

export const updateFormField = async (
  id: string,
  updates: Partial<Omit<FormField, 'id' | 'form_id' | 'created_at' | 'updated_at'>>
): Promise<FormField> => {
  const dbUpdates: Record<string, any> = { ...updates };
  if (updates.options) dbUpdates.options = updates.options as any;
  if (updates.validation_rules) dbUpdates.validation_rules = updates.validation_rules as any;
  if (updates.conditional_logic) dbUpdates.conditional_logic = updates.conditional_logic as any;
  
  const { data, error } = await supabase
    .from('form_fields')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as FormField;
};

export const deleteFormField = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('form_fields')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderFormFields = async (
  formId: string,
  fieldIds: string[]
): Promise<void> => {
  const updates = fieldIds.map((id, index) => ({
    id,
    display_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from('form_fields')
      .update({ display_order: update.display_order })
      .eq('id', update.id);

    if (error) throw error;
  }
};

// Form Submissions
export const fetchFormSubmissions = async (formId: string): Promise<FormSubmission[]> => {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as FormSubmission[];
};

export const createFormSubmission = async (
  formId: string,
  data: Record<string, any>,
  submitterEmail?: string
): Promise<FormSubmission> => {
  const { data: submission, error } = await supabase
    .from('form_submissions')
    .insert({
      form_id: formId,
      data,
      submitter_email: submitterEmail,
      status: 'new',
    })
    .select()
    .single();

  if (error) throw error;
  return submission as unknown as FormSubmission;
};

export const updateSubmissionStatus = async (
  id: string,
  status: FormSubmission['status']
): Promise<void> => {
  const { error } = await supabase
    .from('form_submissions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
};

export const deleteFormSubmission = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('form_submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteFormSubmissions = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from('form_submissions')
    .delete()
    .in('id', ids);

  if (error) throw error;
};

// Stats
export const getFormStats = async (formId: string): Promise<{ total: number; new: number; viewed: number; processed: number }> => {
  const { data, error } = await supabase
    .from('form_submissions')
    .select('status')
    .eq('form_id', formId);

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    new: data?.filter(s => s.status === 'new').length || 0,
    viewed: data?.filter(s => s.status === 'viewed').length || 0,
    processed: data?.filter(s => s.status === 'processed').length || 0,
  };

  return stats;
};
