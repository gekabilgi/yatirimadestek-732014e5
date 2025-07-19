import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { IncentiveCalculatorResults, IncentiveCalculatorInputs } from '@/types/incentiveCalculator';

// Register font for Turkish character support
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

// Color palette
const colors = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  white: '#ffffff',
  black: '#000000',
};

// Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    padding: 20,
    fontFamily: 'Roboto',
  },
  header: {
    marginBottom: 12,
    borderBottom: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 3,
  },
  date: {
    fontSize: 10,
    color: colors.gray,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    borderBottom: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingVertical: 1,
  },
  label: {
    fontSize: 10,
    color: colors.secondary,
    width: '50%',
  },
  value: {
    fontSize: 10,
    color: colors.black,
    width: '50%',
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: colors.lightGray,
    padding: 6,
    borderRadius: 5,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 3,
  },
  totalRow: {
    flexDirection: 'row',
    borderTop: 1,
    borderTopColor: colors.gray,
    paddingTop: 5,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.black,
    width: '50%',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.success,
    width: '50%',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderLeft: 3,
    borderLeftColor: colors.warning,
    padding: 4,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 9,
    color: '#92400e',
  },
  disclaimer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 5,
  },
  disclaimerText: {
    fontSize: 8,
    color: colors.gray,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridItem: {
    width: '48%',
  },
});

interface IncentiveCalculatorReportProps {
  results: IncentiveCalculatorResults;
  inputs: IncentiveCalculatorInputs;
}

export const IncentiveCalculatorReportPDF: React.FC<IncentiveCalculatorReportProps> = ({
  results,
  inputs,
}) => {
  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('tr-TR')} TL`;
  };

  const getSupportPreferenceText = (preference: string): string => {
    return preference === 'Interest/Profit Share Support' ? 'Faiz/Kar Payı Desteği' : 'Makine Desteği';
  };

  const getIncentiveTypeText = (type: string): string => {
    switch (type) {
      case 'Technology Initiative':
        return 'Teknoloji Hamlesi';
      case 'Local Development Initiative':
        return 'Yerel Kalkınma Hamlesi';
      case 'Strategic Initiative':
        return 'Stratejik Hamle';
      default:
        return type;
    }
  };

  const getTaxReductionText = (preference: string): string => {
    return preference === 'Yes' ? 'Evet' : 'Hayır';
  };

  const totalMachineryCost = inputs.importedMachineryCost + inputs.domesticMachineryCost;
  const totalSupport = results.sgkEmployerPremiumSupport + 
                      results.sgkEmployeePremiumSupport + 
                      results.taxReductionInvestmentContribution + 
                      results.machinerySupportAmount + 
                      results.interestProfitShareSupportAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Türkiye Yüzyılı Teşvikleri Hesaplama Raporu</Text>
          <Text style={styles.subtitle}>Yatırım Teşvik Sistemi - Hesaplama Sonuçları</Text>
          <Text style={styles.date}>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</Text>
        </View>

        {/* Warning Messages */}
        {results.warningMessages && results.warningMessages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uyarılar</Text>
            {results.warningMessages.map((warning, index) => (
              <View key={index} style={styles.warningBox}>
                <Text style={styles.warningText}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Investment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yatırım Özeti</Text>
          <View style={styles.summaryBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Toplam Sabit Yatırım Tutarı:</Text>
              <Text style={styles.value}>{formatCurrency(results.totalFixedInvestment)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Toplam Makine Maliyeti:</Text>
              <Text style={styles.value}>{formatCurrency(totalMachineryCost)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>KDV ve Gümrük Muafiyeti:</Text>
              <Text style={styles.value}>{results.vatCustomsExemption}</Text>
            </View>
          </View>
        </View>

        {/* Input Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Girdi Bilgileri</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>Teşvik Türü:</Text>
                <Text style={styles.value}>{getIncentiveTypeText(inputs.incentiveType)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Yatırım İli:</Text>
                <Text style={styles.value}>{inputs.province}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Çalışan Sayısı:</Text>
                <Text style={styles.value}>{inputs.numberOfEmployees} kişi</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Arsa Maliyeti:</Text>
                <Text style={styles.value}>{formatCurrency(inputs.landCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>İnşaat Maliyeti:</Text>
                <Text style={styles.value}>{formatCurrency(inputs.constructionCost)}</Text>
              </View>
            </View>
            <View style={styles.gridItem}>
              <View style={styles.row}>
                <Text style={styles.label}>İthal Makine Maliyeti:</Text>
                <Text style={styles.value}>{formatCurrency(inputs.importedMachineryCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Yerli Makine Maliyeti:</Text>
                <Text style={styles.value}>{formatCurrency(inputs.domesticMachineryCost)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Diğer Giderler:</Text>
                <Text style={styles.value}>{formatCurrency(inputs.otherExpenses)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Destek Tercihi:</Text>
                <Text style={styles.value}>{getSupportPreferenceText(inputs.supportPreference)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vergi İndirimi Desteği:</Text>
                <Text style={styles.value}>{getTaxReductionText(inputs.taxReductionSupport)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek Detayları</Text>
          
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>SGK Destekleri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>İşveren Primi Desteği:</Text>
              <Text style={styles.value}>{formatCurrency(results.sgkEmployerPremiumSupport)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>İşçi Primi Desteği:</Text>
              <Text style={styles.value}>{formatCurrency(results.sgkEmployeePremiumSupport)}</Text>
            </View>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Yatırım Destekleri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Vergi İndirimi / Yatırıma Katkı:</Text>
              <Text style={styles.value}>{formatCurrency(results.taxReductionInvestmentContribution)}</Text>
            </View>
            {results.machinerySupportAmount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Makine Desteği:</Text>
                <Text style={styles.value}>{formatCurrency(results.machinerySupportAmount)}</Text>
              </View>
            )}
            {results.interestProfitShareSupportAmount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Faiz/Kar Payı Desteği:</Text>
                <Text style={styles.value}>{formatCurrency(results.interestProfitShareSupportAmount)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Total Support Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Toplam Destek Özeti</Text>
          <View style={styles.summaryBox}>
            <View style={styles.row}>
              <Text style={styles.label}>SGK İşveren Primi Desteği:</Text>
              <Text style={styles.value}>{formatCurrency(results.sgkEmployerPremiumSupport)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>SGK İşçi Primi Desteği:</Text>
              <Text style={styles.value}>{formatCurrency(results.sgkEmployeePremiumSupport)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Vergi İndirimi / Yatırıma Katkı:</Text>
              <Text style={styles.value}>{formatCurrency(results.taxReductionInvestmentContribution)}</Text>
            </View>
            {results.machinerySupportAmount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Makine Desteği:</Text>
                <Text style={styles.value}>{formatCurrency(results.machinerySupportAmount)}</Text>
              </View>
            )}
            {results.interestProfitShareSupportAmount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Faiz/Kar Payı Desteği:</Text>
                <Text style={styles.value}>{formatCurrency(results.interestProfitShareSupportAmount)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam Parasal Destek:</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalSupport)}</Text>
            </View>
          </View>
        </View>

        {/* Tax Reduction Info */}
        {inputs.taxReductionSupport === 'No' && (
          <View style={styles.section}>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Bilgi: Vergi İndirimi Desteği tercih edilmediği için diğer desteklerin (Faiz/Kar Payı ve Makine) üst limitlerinde artış uygulanmıştır.
              </Text>
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Bu rapor Türkiye Yüzyılı Kalkınma Hamlesi çerçevesinde hazırlanmış olup, 
            yalnızca bilgilendirme amaçlıdır. Kesin sonuçlar için resmi kurumlara başvurunuz. 
            Rapor tarihi: {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default IncentiveCalculatorReportPDF;