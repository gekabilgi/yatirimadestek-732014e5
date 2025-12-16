import { SupportProgram } from "@/types/support";
import { SupportCard } from "./SupportCard";

interface SupportListProps {
  programs: SupportProgram[];
  isLoading?: boolean;
}

export const SupportList = ({ programs, isLoading }: SupportListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">Destek Programı bulunamadı.</div>
        <div className="text-gray-400">Farklı terimleri aratarak yeniden deneyin.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        {programs.length} {programs.length === 1 ? "program" : "program"} bulundu.
      </div>
      {programs.map((program) => (
        <SupportCard key={program.id} program={program} />
      ))}
    </div>
  );
};
