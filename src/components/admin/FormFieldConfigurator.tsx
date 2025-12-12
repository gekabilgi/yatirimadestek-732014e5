import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { FormField, FieldOption, ValidationRules } from '@/types/formBuilder';

interface FormFieldConfiguratorProps {
  field: FormField;
  onUpdate: (updates: Partial<FormField>) => void;
  onClose: () => void;
}

const FormFieldConfigurator: React.FC<FormFieldConfiguratorProps> = ({
  field,
  onUpdate,
  onClose,
}) => {
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [helpText, setHelpText] = useState(field.help_text || '');
  const [isRequired, setIsRequired] = useState(field.is_required);
  const [options, setOptions] = useState<FieldOption[]>(field.options || []);
  const [validationRules, setValidationRules] = useState<ValidationRules>(field.validation_rules || {});

  useEffect(() => {
    setLabel(field.label);
    setPlaceholder(field.placeholder || '');
    setHelpText(field.help_text || '');
    setIsRequired(field.is_required);
    setOptions(field.options || []);
    setValidationRules(field.validation_rules || {});
  }, [field]);

  const handleSave = () => {
    onUpdate({
      label,
      placeholder: placeholder || undefined,
      help_text: helpText || undefined,
      is_required: isRequired,
      options,
      validation_rules: validationRules,
    });
  };

  const handleAddOption = () => {
    const newOption: FieldOption = {
      label: `Seçenek ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    setOptions([...options, newOption]);
  };

  const handleUpdateOption = (index: number, updates: Partial<FieldOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.field_type);
  const isDecorative = ['heading', 'paragraph', 'divider'].includes(field.field_type);
  const hasValidation = ['text', 'textarea', 'number', 'email', 'phone'].includes(field.field_type);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Alan Ayarları</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">
            {isDecorative ? (field.field_type === 'heading' ? 'Başlık' : 'Metin') : 'Alan Etiketi'}
          </Label>
          {field.field_type === 'paragraph' ? (
            <Textarea
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          )}
        </div>

        {/* Placeholder - only for input fields */}
        {!isDecorative && field.field_type !== 'file' && (
          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder="örn: Adınızı girin"
            />
          </div>
        )}

        {/* Help Text - only for input fields */}
        {!isDecorative && (
          <div className="space-y-2">
            <Label htmlFor="helpText">Yardım Metni</Label>
            <Input
              id="helpText"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Alan altında görünecek açıklama"
            />
          </div>
        )}

        {/* Required - only for input fields */}
        {!isDecorative && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Zorunlu Alan</Label>
                <p className="text-sm text-muted-foreground">Bu alan doldurulmalı mı?</p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </>
        )}

        {/* Options - for select, radio, checkbox */}
        {hasOptions && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Seçenekler</Label>
                <Button variant="outline" size="sm" onClick={handleAddOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ekle
                </Button>
              </div>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <Input
                      value={option.label}
                      onChange={(e) => handleUpdateOption(index, { 
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                      placeholder="Seçenek adı"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              {options.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  En az bir seçenek ekleyin
                </p>
              )}
            </div>
          </>
        )}

        {/* Validation Rules */}
        {hasValidation && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label>Doğrulama Kuralları</Label>
              
              {(field.field_type === 'text' || field.field_type === 'textarea') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minLength" className="text-sm">Min. Karakter</Label>
                    <Input
                      id="minLength"
                      type="number"
                      min="0"
                      value={validationRules.minLength || ''}
                      onChange={(e) => setValidationRules({
                        ...validationRules,
                        minLength: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLength" className="text-sm">Max. Karakter</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      min="0"
                      value={validationRules.maxLength || ''}
                      onChange={(e) => setValidationRules({
                        ...validationRules,
                        maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                    />
                  </div>
                </div>
              )}

              {field.field_type === 'number' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="min" className="text-sm">Min. Değer</Label>
                    <Input
                      id="min"
                      type="number"
                      value={validationRules.min || ''}
                      onChange={(e) => setValidationRules({
                        ...validationRules,
                        min: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max" className="text-sm">Max. Değer</Label>
                    <Input
                      id="max"
                      type="number"
                      value={validationRules.max || ''}
                      onChange={(e) => setValidationRules({
                        ...validationRules,
                        max: e.target.value ? parseInt(e.target.value) : undefined,
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Separator />

        <Button onClick={handleSave} className="w-full">
          Değişiklikleri Kaydet
        </Button>
      </CardContent>
    </Card>
  );
};

export default FormFieldConfigurator;
