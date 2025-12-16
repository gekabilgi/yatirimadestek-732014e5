import React, { useState } from 'react';
import { 
  ClipboardList, 
  MessageSquare, 
  Mail, 
  Calendar, 
  FileText,
  Check
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FORM_TEMPLATE_PRESETS, TEMPLATE_CATEGORIES, FormTemplatePreset } from '@/data/formTemplatePresets';

interface FormTemplateGalleryProps {
  onSelectTemplate: (template: FormTemplatePreset) => void;
  selectedTemplateId?: string;
}

const iconMap: Record<string, React.ElementType> = {
  ClipboardList,
  MessageSquare,
  Mail,
  Calendar,
  FileText,
};

const FormTemplateGallery: React.FC<FormTemplateGalleryProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = activeCategory === 'all'
    ? FORM_TEMPLATE_PRESETS
    : FORM_TEMPLATE_PRESETS.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(category.id)}
            className="rounded-full"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredTemplates.map((template) => {
          const IconComponent = iconMap[template.icon] || FileText;
          const isSelected = selectedTemplateId === template.id;
          const accentColor = template.branding.accent_color || '#0d9488';

          return (
            <Card 
              key={template.id}
              className={`
                group cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden
                ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:border-primary/50'}
              `}
              onClick={() => onSelectTemplate(template)}
            >
              {/* Preview Header */}
              <div 
                className="h-24 relative overflow-hidden"
                style={{ backgroundColor: template.branding.background_color }}
              >
                {/* Corner Decoration */}
                <div 
                  className="absolute top-0 left-0 w-0 h-0"
                  style={{
                    borderTop: `60px solid ${accentColor}`,
                    borderRight: '60px solid transparent',
                  }}
                />
                
                {/* Title Preview */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h3 
                      className="text-lg font-black uppercase tracking-tight"
                      style={{ color: accentColor }}
                    >
                      {template.branding.header_title}
                    </h3>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      {template.branding.header_subtitle}
                    </p>
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <IconComponent 
                      className="w-5 h-5" 
                      style={{ color: accentColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground truncate">
                        {template.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {template.categoryLabel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {template.fields.length} alan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default FormTemplateGallery;
