import { Calendar, ExternalLink, FileText, Building2, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileAttachment {
  id: string;
  filename: string;
  file_url: string;
}

interface Tag {
  id: number;
  name: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
}

export interface SupportProgramCardData {
  id: string;
  title: string;
  kurum: string;
  kurum_logo?: string;
  son_tarih?: string;
  ozet: string;
  uygunluk?: string;
  iletisim?: string;
  belgeler: FileAttachment[];
  tags: Tag[];
  detay_link: string;
}

interface SupportProgramCardProps {
  data: SupportProgramCardData;
}

export function SupportProgramCard({ data }: SupportProgramCardProps) {
  const { title, kurum, son_tarih, ozet, uygunluk, belgeler, tags, detay_link } = data;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isDeadlineSoon = () => {
    if (!son_tarih) return false;
    const deadline = new Date(son_tarih);
    const today = new Date();
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isDeadlinePassed = () => {
    if (!son_tarih) return false;
    return new Date(son_tarih) < new Date();
  };

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    const categoryName = tag.category?.name || "Diğer";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <Card className="border-l-4 border-l-primary bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 space-y-2">
        {/* Header: Kurum + Son Tarih */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{kurum}</span>
          </div>
          {son_tarih && (
            <Badge
              variant={isDeadlinePassed() ? "secondary" : isDeadlineSoon() ? "destructive" : "outline"}
              className={cn(
                "text-xs whitespace-nowrap",
                isDeadlineSoon() && !isDeadlinePassed() && "bg-orange-100 text-orange-700 border-orange-300",
                isDeadlinePassed() && "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="w-3 h-3 mr-1" />
              {isDeadlinePassed() ? "Kapandı" : `Son: ${formatDate(son_tarih)}`}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-foreground leading-tight">{title}</h4>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Özet */}
        <p className="text-sm text-muted-foreground line-clamp-3">{ozet}</p>

        {/* Uygunluk Kriterleri */}
        {uygunluk && (
          <div className="flex items-start gap-2 text-sm">
            <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground line-clamp-2">{uygunluk}</span>
          </div>
        )}

        {/* Tags */}
        {Object.keys(tagsByCategory).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(tagsByCategory).flatMap(([category, categoryTags]) =>
              categoryTags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 bg-primary/5 text-primary border-primary/20"
                >
                  {tag.name}
                </Badge>
              ))
            )}
            {tags.length > 6 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                +{tags.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Belgeler */}
        {belgeler && belgeler.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" />
              İlgili Belgeler
            </span>
            <div className="flex flex-wrap gap-1.5">
              {belgeler.slice(0, 3).map((belge) => (
                <a
                  key={belge.id}
                  href={belge.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted/60 rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{belge.filename}</span>
                </a>
              ))}
              {belgeler.length > 3 && (
                <span className="text-[11px] text-muted-foreground px-2 py-1">
                  +{belgeler.length - 3} belge
                </span>
              )}
            </div>
          </div>
        )}

        {/* Detay Butonu */}
        <div className="pt-2 flex justify-end">
          <Button variant="outline" size="sm" asChild className="h-8 text-xs">
            <a href={detay_link} target="_blank" rel="noopener noreferrer">
              Detaya Git
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
