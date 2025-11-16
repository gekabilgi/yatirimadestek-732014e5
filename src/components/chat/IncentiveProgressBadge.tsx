import { Check } from "lucide-react";

interface IncentiveQueryProgress {
  sector?: string;
  province?: string;
  district?: string;
  osb_status?: string;
  status: 'collecting' | 'completed';
}

interface IncentiveProgressBadgeProps {
  progress: IncentiveQueryProgress;
}

export function IncentiveProgressBadge({ progress }: IncentiveProgressBadgeProps) {
  const steps = [
    { key: 'sector' as keyof IncentiveQueryProgress, label: 'Sektör', icon: '🏭' },
    { key: 'province' as keyof IncentiveQueryProgress, label: 'İl', icon: '🗺️' },
    { key: 'district' as keyof IncentiveQueryProgress, label: 'İlçe', icon: '📍' },
    { key: 'osb_status' as keyof IncentiveQueryProgress, label: 'OSB', icon: '🏗️' }
  ];
  
  return (
    <div className="flex gap-2 p-3 bg-primary/5 rounded-lg mb-4 border border-primary/10">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <span>Teşvik Hesaplama:</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {steps.map(step => (
          <div 
            key={step.key} 
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-xs transition-all
              ${progress[step.key] 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-muted text-muted-foreground border border-border'
              }
            `}
          >
            <span>{step.icon}</span>
            <span className="font-medium">{step.label}</span>
            {progress[step.key] && <Check className="h-3 w-3" />}
          </div>
        ))}
      </div>
      {progress.status === 'completed' && (
        <div className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-700 border border-green-500/30">
          <Check className="h-3 w-3" />
          <span className="font-medium">Tamamlandı</span>
        </div>
      )}
    </div>
  );
}
