import { MessageSquare } from "lucide-react";

interface FollowUpQuestionCardProps {
  question: string;
}

export function FollowUpQuestionCard({ question }: FollowUpQuestionCardProps) {
  return (
    <div className="mt-4 pt-4 border-t border-border/40">
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 
                      border-2 border-primary/40 p-4 shadow-sm animate-in fade-in-50 duration-300">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 
                          flex items-center justify-center ring-2 ring-primary/30">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">
              Devam Etmek İçin
            </p>
            <p className="text-base font-medium text-foreground leading-relaxed">
              {question}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
