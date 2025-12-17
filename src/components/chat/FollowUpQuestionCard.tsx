import { MessageSquare, FileText } from "lucide-react";

interface FollowUpQuestionCardProps {
  question?: string | null;
  supportCardsNotice?: string | null;
}

export function FollowUpQuestionCard({ question, supportCardsNotice }: FollowUpQuestionCardProps) {
  // En az bir içerik olmalı
  if (!question && !supportCardsNotice) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/40">
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 
                      border-2 border-primary/40 p-4 shadow-sm animate-in fade-in-50 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 
                          flex items-center justify-center ring-2 ring-primary/30">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Devam Etmek İçin
            </p>
            {/* Takip sorusu (varsa) */}
            {question && (
              <p className="text-base font-medium text-foreground leading-relaxed">
                {question}
              </p>
            )}
            {/* Destek programları bildirimi (varsa) */}
            {supportCardsNotice && (
              <div className="flex items-center gap-2 text-sm text-primary/80 pt-2 border-t border-primary/20">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>{supportCardsNotice}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
