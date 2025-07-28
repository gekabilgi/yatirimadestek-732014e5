import React, { useState, useEffect } from 'react';
import { Upload, X, Plus, Check, Minus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Institution, Tag, TagCategory, SupportProgram, FileAttachment } from '@/types/support';
import { DraggableFileList } from './DraggableFileList';

interface AdminSupportFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  editingProgram?: SupportProgram | null;
  isLoading?: boolean;
}

export const AdminSupportForm = ({ onSubmit, onCancel, editingProgram, isLoading }: AdminSupportFormProps) => {
  const [formData, setFormData] = useState({
    institution_id: '',
    title: '',
    description: '',
    application_deadline: '',
    eligibility_criteria: '',
    contact_info: '',
  });
  
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<FileAttachment[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tagsByCategory, setTagsByCategory] = useState<Record<string, Tag[]>>({});
  const [categories, setCategories] = useState<TagCategory[]>([]);

  useEffect(() => {
    fetchInstitutions();
    fetchTagsAndCategories();
  }, []);

  useEffect(() => {
    if (editingProgram) {
      setFormData({
        institution_id: editingProgram.institution_id?.toString() || '',
        title: editingProgram.title,
        description: editingProgram.description,
        application_deadline: editingProgram.application_deadline || '',
        eligibility_criteria: editingProgram.eligibility_criteria || '',
        contact_info: editingProgram.contact_info || '',
      });
      setSelectedTags(editingProgram.tags.map(tag => tag.id));
      setExistingFiles(editingProgram.files || []);
      setFiles([]); // Reset new files when editing
    }
  }, [editingProgram]);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching institutions:', error);
        toast.error('Failed to load institutions');
      } else {
        setInstitutions(data || []);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      toast.error('Failed to load institutions');
    }
  };

  const fetchTagsAndCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('tag_categories')
        .select('*')
        .order('id');

      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*, category:tag_categories(*)')
        .order('name');

      if (categoriesError || tagsError) {
        console.error('Error fetching tags/categories:', categoriesError || tagsError);
        toast.error('Failed to load tags');
      } else {
        setCategories(categoriesData || []);
        
        // Group tags by category
        const grouped = (tagsData || []).reduce((acc, tag) => {
          const categoryName = tag.category?.name || 'Other';
          if (!acc[categoryName]) acc[categoryName] = [];
          acc[categoryName].push(tag);
          return acc;
        }, {} as Record<string, Tag[]>);
        
        setTagsByCategory(grouped);
      }
    } catch (error) {
      console.error('Error fetching tags/categories:', error);
      toast.error('Failed to load tags');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSelectAllInCategory = (categoryName: string) => {
    const categoryTags = tagsByCategory[categoryName] || [];
    const categoryTagIds = categoryTags.map(tag => tag.id);
    setSelectedTags(prev => [...new Set([...prev, ...categoryTagIds])]);
  };

  const handleDeselectAllInCategory = (categoryName: string) => {
    const categoryTags = tagsByCategory[categoryName] || [];
    const categoryTagIds = categoryTags.map(tag => tag.id);
    setSelectedTags(prev => prev.filter(id => !categoryTagIds.includes(id)));
  };

  const handleAddNewTag = (categoryName: string) => {
    const tagName = prompt(`Enter new tag for ${categoryName}:`);
    if (tagName && tagName.trim()) {
      // Here you would implement the logic to add a new tag to the database
      toast.success(`New tag "${tagName}" will be added to ${categoryName}`);
      // TODO: Implement actual tag creation
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const reorderFiles = (startIndex: number, endIndex: number) => {
    setFiles(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const removeExistingFile = async (fileId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      // Remove from local state
      setExistingFiles(prev => prev.filter(file => file.id !== fileId));
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const reorderExistingFiles = async (startIndex: number, endIndex: number) => {
    const reorderedFiles = Array.from(existingFiles);
    const [removed] = reorderedFiles.splice(startIndex, 1);
    reorderedFiles.splice(endIndex, 0, removed);

    // Update display_order for all files
    const updates = reorderedFiles.map((file, index) => ({
      id: file.id,
      display_order: index + 1
    }));

    try {
      // Update database with new order
      for (const update of updates) {
        const { error } = await supabase
          .from('file_attachments')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Update local state
      setExistingFiles(reorderedFiles.map((file, index) => ({
        ...file,
        display_order: index + 1
      })));

      toast.success('Files reordered successfully');
    } catch (error) {
      console.error('Error reordering files:', error);
      toast.error('Failed to reorder files');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.institution_id || !formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = {
      ...formData,
      institution_id: parseInt(formData.institution_id),
      tags: selectedTags,
      files: files,
      id: editingProgram?.id, // Include ID for updates
      existingFiles: existingFiles, // Include existing files for reference
    };

    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      institution_id: '',
      title: '',
      description: '',
      application_deadline: '',
      eligibility_criteria: '',
      contact_info: '',
    });
    setSelectedTags([]);
    setFiles([]);
    setExistingFiles([]);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Applicant Type': return '👥';
      case 'Support Type': return '💰';
      case 'Benefit Type': return '🎯';
      case 'Sector': return '🏭';
      case 'Province': return '📍';
      default: return '🏷️';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case 'Applicant Type': return 'from-blue-50 to-blue-100 border-blue-200';
      case 'Support Type': return 'from-green-50 to-green-100 border-green-200';
      case 'Benefit Type': return 'from-purple-50 to-purple-100 border-purple-200';
      case 'Sector': return 'from-orange-50 to-orange-100 border-orange-200';
      case 'Province': return 'from-red-50 to-red-100 border-red-200';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="institution">Select Institution *</Label>
              <Select value={formData.institution_id} onValueChange={(value) => handleInputChange('institution_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kurum Seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id.toString()}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => handleInputChange('application_deadline', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="title">Support Program Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter support program name"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detailed description of the support program"
                rows={4}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="eligibility">Eligibility Criteria</Label>
              <Textarea
                id="eligibility"
                value={formData.eligibility_criteria}
                onChange={(e) => handleInputChange('eligibility_criteria', e.target.value)}
                placeholder="Who is eligible for this program?"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="contact">Contact Information</Label>
              <Input
                id="contact"
                value={formData.contact_info}
                onChange={(e) => handleInputChange('contact_info', e.target.value)}
                placeholder="Contact details or institution info"
              />
            </div>
          </div>

          <Separator className="my-8" />

          {/* Tags by Category */}
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tag Categories</h3>
            {categories.map((category, index) => (
              <div key={category.id} className="space-y-4">
                <div className={`p-6 rounded-xl border-2 bg-gradient-to-r ${getCategoryColor(category.name)} shadow-sm`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                      <h4 className="text-lg font-semibold text-gray-800">{category.name}</h4>
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                        {(tagsByCategory[category.name] || []).filter(tag => selectedTags.includes(tag.id)).length} selected
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllInCategory(category.name)}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeselectAllInCategory(category.name)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Minus className="w-4 h-4 mr-1" />
                        Deselect All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNewTag(category.name)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add New
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(tagsByCategory[category.name] || []).map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <Label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                {index < categories.length - 1 && <Separator className="my-6" />}
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          <div>
            <Label>Related Files</Label>
            
            {/* Show existing files when editing */}
            {editingProgram && existingFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current Files</h4>
                <DraggableFileList 
                  files={existingFiles.map(file => ({ 
                    name: file.filename, 
                    size: 0, 
                    id: file.id 
                  }))}
                  onRemove={(index) => removeExistingFile(existingFiles[index].id)}
                  onReorder={reorderExistingFiles}
                  isExistingFiles={true}
                />
              </div>
            )}

            {/* Upload new files */}
            <div className="mt-4">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <div>
                    <Upload className="w-4 h-4 mr-2" />
                    {editingProgram ? 'Add More Files' : 'Upload Files'}
                  </div>
                </Button>
              </label>
              {editingProgram && files.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  New files will replace all existing files when you save
                </p>
              )}
            </div>
            
            {/* Show new files to be uploaded */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {editingProgram ? 'New Files (will replace current files)' : 'New Files'}
                </h4>
                <DraggableFileList 
                  files={files}
                  onRemove={removeFile}
                  onReorder={reorderFiles}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset Form
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (editingProgram ? 'Updating...' : 'Creating...') : (editingProgram ? 'Update Support Program' : 'Create Support Program')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
