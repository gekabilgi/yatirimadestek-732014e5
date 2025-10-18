import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, ExternalLink, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalDocument {
  id: string;
  title: string;
  description: string;
  document_type: string;
  ministry: string;
  file_url: string;
  external_url: string;
  publication_date: string;
  status: string;
  keywords: string;
  document_number: string;
  display_order: number;
}

interface DraggableLegalDocumentListProps {
  documents: LegalDocument[];
  onReorder: (reorderedDocuments: LegalDocument[]) => void;
  onEdit: (document: LegalDocument) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onResetOrder: () => void;
}

export const DraggableLegalDocumentList: React.FC<DraggableLegalDocumentListProps> = ({
  documents,
  onReorder,
  onEdit,
  onToggleStatus,
  onDelete,
  onResetOrder,
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newDocuments = [...documents];
    const draggedDocument = newDocuments[draggedItem];

    // Remove dragged item
    newDocuments.splice(draggedItem, 1);

    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newDocuments.splice(insertIndex, 0, draggedDocument);

    // Update display_order for all documents
    const reorderedDocuments = newDocuments.map((doc, index) => ({
      ...doc,
      display_order: index + 1,
    }));

    onReorder(reorderedDocuments);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR");
  };

  const hasCustomOrder = documents.some((doc) => doc.display_order > 0);

  return (
    <div className="space-y-4">
      {/* Header with reset button */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Dökümanları sürükleyerek sıralayın. Üst sıradaki dökümanlar sitede önce görünecektir.
          </p>
          {hasCustomOrder && (
            <p className="text-xs text-blue-600">
              Özel sıralama aktif. Sırayı sıfırlamak için "Sıralamayı Sıfırla" butonunu kullanın.
            </p>
          )}
        </div>
        {hasCustomOrder && (
          <Button variant="outline" size="sm" onClick={onResetOrder} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Sıralamayı Sıfırla
          </Button>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <div
            key={doc.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-4 p-4 border rounded-lg bg-card cursor-move transition-all",
              draggedItem === index && "opacity-50 scale-95",
              dragOverItem === index && draggedItem !== index && "border-primary bg-primary/5",
              "hover:shadow-md",
            )}
          >
            {/* Position and Drag Handle */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {doc.display_order > 0 ? doc.display_order : index + 1}
              </div>
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h6 className="font-medium text-foreground truncate">{doc.title}</h6>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{doc.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline">{doc.document_type}</Badge>
                    {doc.ministry && <span className="text-sm text-muted-foreground">{doc.ministry}</span>}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.publication_date)}
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={doc.status === "active" ? "default" : "secondary"}>
                    {doc.status === "active" ? "Aktif" : "Pasif"}
                  </Badge>

                  <div className="flex items-center gap-1">
                    {(doc.file_url || doc.external_url) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url || doc.external_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onEdit(doc)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onToggleStatus(doc.id, doc.status)}>
                      {doc.status === "active" ? "Pasif Et" : "Aktif Et"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(doc.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Sil
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Henüz döküman eklenmemiş.</div>
      )}
    </div>
  );
};
