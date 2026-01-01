import React, { lazy, Suspense, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { IncentiveCalculatorResults, IncentiveCalculatorInputs } from '@/types/incentiveCalculator';
import { IncentiveResult } from '@/types/incentive';
import { useToast } from '@/hooks/use-toast';

// Lazy load the PDF components - they will only be loaded when needed
const IncentiveCalculatorReportPDF = lazy(() => import('@/components/IncentiveCalculatorReportPDF'));
const IncentiveReportPDF = lazy(() => import('@/components/IncentiveReportPDF'));

interface LazyPDFDownloadProps {
  type: 'calculator' | 'incentive';
  results?: IncentiveCalculatorResults;
  inputs?: IncentiveCalculatorInputs;
  incentiveResult?: IncentiveResult;
  fileName?: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LazyPDFDownload: React.FC<LazyPDFDownloadProps> = ({
  type,
  results,
  inputs,
  incentiveResult,
  fileName = 'rapor.pdf',
  buttonText = 'PDF İndir',
  className,
  variant = 'outline',
  size = 'default',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Dynamically import the pdf function from @react-pdf/renderer
      const { pdf } = await import('@react-pdf/renderer');
      
      let pdfDocument: React.ReactElement | null = null;
      
      if (type === 'calculator' && results && inputs) {
        const { default: CalculatorReport } = await import('@/components/IncentiveCalculatorReportPDF');
        pdfDocument = <CalculatorReport results={results} inputs={inputs} />;
      } else if (type === 'incentive' && incentiveResult) {
        const { default: IncentiveReport } = await import('@/components/IncentiveReportPDF');
        pdfDocument = <IncentiveReport incentiveResult={incentiveResult} />;
      }
      
      if (!pdfDocument) {
        throw new Error('Gerekli veriler eksik');
      }
      
      // Generate the PDF blob
      const blob = await pdf(pdfDocument).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'PDF oluşturuldu',
        description: 'Rapor başarıyla indirildi.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Hata',
        description: 'PDF oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [type, results, inputs, incentiveResult, fileName, toast]);

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          PDF Hazırlanıyor...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default LazyPDFDownload;
