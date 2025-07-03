
import { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AdminEntryFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const mockTags = [
  { id: '1', name: 'Small Business', category: 'Support Type' },
  { id: '2', name: 'Technology', category: 'Sector' },
  { id: '3', name: 'Healthcare', category: 'Sector' },
  { id: '4', name: 'Grant', category: 'Support Type' },
  { id: '5', name: 'Region 4', category: 'Location' },
];

export const AdminEntryForm = ({ onSubmit, isLoading }: AdminEntryFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    application_deadline: '',
    eligibility_criteria: '',
    contact_info: '',
  });
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    const submitData = {
      ...formData,
      tags: selectedTags,
      files: files,
    };

    onSubmit(submitData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      application_deadline: '',
      eligibility_criteria: '',
      contact_info: '',
    });
    setSelectedTags([]);
    setFiles([]);
  };

  return (
    <div className="space-y-8 mt-16">
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-900">Add New Support Program</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="title">Program Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter program title"
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

            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => handleInputChange('application_deadline', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="contact">Contact Information</Label>
              <Input
                id="contact"
                value={formData.contact_info}
                onChange={(e) => handleInputChange('contact_info', e.target.value)}
                placeholder="Institution or contact details"
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
          </div>

          <div>
            <Label>Tags</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {mockTags.map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{tag.name}</div>
                  <div className="text-xs text-gray-500">{tag.category}</div>
                </div>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTags.map((tagId) => {
                  const tag = mockTags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tagId} variant="secondary">
                      {tag.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <Label>File Attachments</Label>
            <div className="mt-2">
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" className="cursor-pointer" asChild>
                  <div>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload PDFs
                  </div>
                </Button>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset Form
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Creating...' : 'Create Program'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
      </div>
  );
};
