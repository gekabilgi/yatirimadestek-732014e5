import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';
import { PaymentPlanDetail } from '@/types/incentiveCalculator';

interface PaymentPlanPopoverProps {
  paymentPlan: PaymentPlanDetail[];
}

export const PaymentPlanPopover: React.FC<PaymentPlanPopoverProps> = ({ paymentPlan }) => {
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Ödeme Planını Görüntüle
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="center">
        <div className="p-3 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <h3 className="font-semibold text-base">Aylık Ödeme Planı</h3>
          <p className="text-xs text-muted-foreground">Detaylı kredi ödeme planı ve faiz dağılımı</p>
        </div>
        <ScrollArea className="h-[350px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-center text-xs py-2">Taksit</TableHead>
                <TableHead className="text-right text-xs py-2">Taksit Tutarı (TL)</TableHead>
                <TableHead className="text-right text-xs py-2">Anapara (TL)</TableHead>
                <TableHead className="text-right text-xs py-2">Faiz (TL)</TableHead>
                <TableHead className="text-right text-xs py-2">BSMV (TL)</TableHead>
                <TableHead className="text-right text-xs py-2">KKDF (TL)</TableHead>
                <TableHead className="text-right text-xs py-2">Kalan (TL)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentPlan.map((payment) => (
                <TableRow key={payment.taksitNo} className="hover:bg-muted/20">
                  <TableCell className="text-center font-medium text-xs py-1.5">{payment.taksitNo}</TableCell>
                  <TableCell className="text-right text-xs py-1.5 font-medium">{formatCurrency(payment.taksitTutari)}</TableCell>
                  <TableCell className="text-right text-xs py-1.5">{formatCurrency(payment.anaparaOdemesi)}</TableCell>
                  <TableCell className="text-right text-xs py-1.5">{formatCurrency(payment.faizTutari)}</TableCell>
                  <TableCell className="text-right text-xs py-1.5">{formatCurrency(payment.bsmv)}</TableCell>
                  <TableCell className="text-right text-xs py-1.5">{formatCurrency(payment.kkdf)}</TableCell>
                  <TableCell className="text-right text-xs py-1.5">{formatCurrency(payment.kalanAnapara)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="p-3 border-t bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground">Toplam Faiz Tutarı:</span>
              <div className="font-semibold text-sm">
                {formatCurrency(paymentPlan.reduce((total, p) => total + p.faizTutari, 0))}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Toplam BSMV:</span>
              <div className="font-semibold text-sm">
                {formatCurrency(paymentPlan.reduce((total, p) => total + p.bsmv, 0))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};