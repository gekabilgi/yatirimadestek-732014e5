import { Home, Trash2, Download, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  sessionTitle: string;
  onClearChat: () => void;
  onExportChat: () => void;
  onRenameSession: (newTitle: string) => void;
}

export function ChatHeader({ 
  sessionTitle, 
  onClearChat, 
  onExportChat,
  onRenameSession 
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(sessionTitle);

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onRenameSession(editedTitle.trim());
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(sessionTitle);
    setIsEditing(false);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-2 md:px-4 py-2.5 md:py-3">
        {/* Left: Home button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          title="Anasayfa"
          className="h-8 w-8 md:h-10 md:w-10"
        >
          <Home className="h-4 w-4 md:h-5 md:w-5" />
        </Button>

        {/* Center: Session title (editable) */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-md px-2">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                className="flex-1 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={handleSaveTitle}>
                <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={handleCancelEdit}>
                <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </>
          ) : (
            <>
              <h1 className="text-sm md:text-lg font-semibold truncate">{sessionTitle}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsEditing(true)}
                title="Yeniden adlandır"
              >
                <Edit2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
              </Button>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 md:gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExportChat}
            title="Sohbeti dışa aktar"
            className="h-8 w-8 md:h-10 md:w-10 hidden sm:flex"
          >
            <Download className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearChat}
            title="Sohbeti temizle"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
