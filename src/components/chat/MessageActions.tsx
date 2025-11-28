import { Copy, RotateCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface MessageActionsProps {
  content: string;
  isAssistant: boolean;
  onRegenerate?: () => void;
}

export function MessageActions({ content, isAssistant, onRegenerate }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({
        description: "Mesaj kopyalandı",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Kopyalama başarısız oldu",
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground/80">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 rounded-full hover:bg-muted"
        onClick={handleCopy}
        title="Kopyala"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>

      {isAssistant && onRegenerate && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-muted"
          onClick={onRegenerate}
          title="Yeniden oluştur"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
