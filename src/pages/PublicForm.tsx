import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  fetchFormTemplateBySlug,
  fetchFormFields,
  createFormSubmission,
} from '@/services/formBuilderService';
import type { FormTemplate, FormField } from '@/types/formBuilder';
import IntegratedFormLayout from '@/components/IntegratedFormLayout';

const PublicForm: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      loadForm();
    }
  }, [slug]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const formData = await fetchFormTemplateBySlug(slug!);
      
      if (!formData) {
        toast.error('Form bulunamadı');
        return;
      }

      const fieldsData = await fetchFormFields(formData.id);
      setForm(formData);
      setFields(fieldsData);

      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      fieldsData.forEach(field => {
        if (field.field_type === 'checkbox') {
          initialData[field.name] = [];
        } else {
          initialData[field.name] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Form yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (['heading', 'paragraph', 'divider'].includes(field.field_type)) return;

      const value = formData[field.name];

      // Required check
      if (field.is_required) {
        if (field.field_type === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            newErrors[field.name] = 'Bu alan zorunludur';
          }
        } else if (!value || value.trim() === '') {
          newErrors[field.name] = 'Bu alan zorunludur';
        }
      }

      // Skip further validation if empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) return;

      // Type-specific validation
      const rules = field.validation_rules || {};

      if (field.field_type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Geçerli bir e-posta adresi girin';
        }
      }

      if (field.field_type === 'phone') {
        const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
          newErrors[field.name] = 'Geçerli bir telefon numarası girin';
        }
      }

      if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
        newErrors[field.name] = `En az ${rules.minLength} karakter olmalıdır`;
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        newErrors[field.name] = `En fazla ${rules.maxLength} karakter olabilir`;
      }

      if (rules.min !== undefined && field.field_type === 'number') {
        if (parseFloat(value) < rules.min) {
          newErrors[field.name] = `Değer en az ${rules.min} olmalıdır`;
        }
      }

      if (rules.max !== undefined && field.field_type === 'number') {
        if (parseFloat(value) > rules.max) {
          newErrors[field.name] = `Değer en fazla ${rules.max} olabilir`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Lütfen formu doğru şekilde doldurun');
      return;
    }

    try {
      setSubmitting(true);
      
      // Find email field value
      const emailField = fields.find(f => f.field_type === 'email');
      const submitterEmail = emailField ? formData[emailField.name] : undefined;

      await createFormSubmission(form!.id, formData, submitterEmail);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Form gönderilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }
  };

  const handleCheckboxChange = (fieldName: string, optionValue: string, checked: boolean) => {
    const currentValues = formData[fieldName] || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionValue];
    } else {
      newValues = currentValues.filter((v: string) => v !== optionValue);
    }
    
    handleFieldChange(fieldName, newValues);
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const value = formData[field.name];

    switch (field.field_type) {
      case 'heading':
        return (
          <h3 className="text-xl font-semibold text-foreground">{field.label}</h3>
        );

      case 'paragraph':
        return (
          <p className="text-muted-foreground">{field.label}</p>
        );

      case 'divider':
        return <Separator />;

      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              min={field.validation_rules?.min}
              max={field.validation_rules?.max}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(v) => handleFieldChange(field.name, v)}>
              <SelectTrigger className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={field.placeholder || 'Seçiniz'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, idx) => (
                  <SelectItem key={idx} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup value={value || ''} onValueChange={(v) => handleFieldChange(field.name, v)}>
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.name}_${idx}`} />
                  <Label htmlFor={`${field.name}_${idx}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            <Label>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}_${idx}`}
                    checked={(value || []).includes(option.value)}
                    onCheckedChange={(checked) => handleCheckboxChange(field.name, option.value, !!checked)}
                  />
                  <Label htmlFor={`${field.name}_${idx}`} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.name, file.name);
                }
              }}
              className={error ? 'border-destructive' : ''}
            />
            {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Form not found
  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Form Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">
              Aradığınız form mevcut değil veya artık aktif değil.
            </p>
            <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form submitted success state
  const successContent = (
    <Card className="max-w-md w-full mx-auto">
      <CardContent className="pt-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Teşekkürler!</h2>
        <p className="text-muted-foreground">
          {form.settings?.success_message || 'Form başarıyla gönderildi!'}
        </p>
      </CardContent>
    </Card>
  );

  // Form content
  const formContent = (
    <Card>
      <CardHeader>
        <CardTitle>{form.name}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => (
            <div key={field.id}>{renderField(field)}</div>
          ))}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              form.settings?.submit_button_text || 'Gönder'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Render based on display mode
  if (form.display_mode === 'integrated') {
    return (
      <IntegratedFormLayout form={form}>
        {submitted ? successContent : formContent}
      </IntegratedFormLayout>
    );
  }

  // Standalone mode (default)
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {successContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {formContent}
      </div>
    </div>
  );
};

export default PublicForm;
