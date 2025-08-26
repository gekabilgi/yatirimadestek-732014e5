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
    return `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Ödeme Planını Görüntüle
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" align="center">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Aylık Ödeme Planı</h3>
          <p className="text-sm text-muted-foreground">Detaylı kredi ödeme planı ve faiz dağılımı</p>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Taksit No</TableHead>
                <TableHead className="text-right">Taksit Tutarı</TableHead>
                <TableHead className="text-right">Anapara Ödemesi</TableHead>
                <TableHead className="text-right">Faiz Tutarı</TableHead>
                <TableHead className="text-right">BSMV</TableHead>
                <TableHead className="text-right">KKDF</TableHead>
                <TableHead className="text-right">Kalan Anapara</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentPlan.map((payment) => (
                <TableRow key={payment.taksitNo}>
                  <TableCell className="text-center font-medium">{payment.taksitNo}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.taksitTutari)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.anaparaOdemesi)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.faizTutari)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.bsmv)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.kkdf)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(payment.kalanAnapara)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="p-4 border-t bg-muted/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Toplam Faiz Tutarı:</span>
              <div className="font-semibold">
                {formatCurrency(paymentPlan.reduce((total, p) => total + p.faizTutari, 0))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Toplam BSMV:</span>
              <div className="font-semibold">
                {formatCurrency(paymentPlan.reduce((total, p) => total + p.bsmv, 0))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};