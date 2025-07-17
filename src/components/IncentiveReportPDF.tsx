import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { IncentiveResult } from '@/types/incentive';

// Register custom font for Turkish character support
// Place your font files in public/fonts/ folder
Font.register({
  family: 'Noto Sans',
  src: '/fonts/NotoSans-Regular.ttf', // Update this path when you add your font
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans',
    fontSize: 9,
    padding: 40,
    color: '#333',
    lineHeight: 1.3,
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: 12,
    textAlign: 'center',
    marginBottom: 12,
    borderRadius: 3,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 8,
    padding: 8,
    border: '1px solid #eee',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#007bff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    borderBottom: '1px dotted #ccc',
    paddingBottom: 2,
  },
  label: {
    color: '#555',
    flex: 1,
    fontSize: 8,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
  badge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '2px 4px',
    borderRadius: 2,
    fontSize: 7,
    marginRight: 3,
    marginBottom: 3,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: '#aaa',
    fontSize: 7,
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: 3,
    padding: 6,
    marginBottom: 6,
    color: '#856404',
    fontSize: 8,
  },
  subSection: {
    marginBottom: 6,
  },
  subSectionTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
    fontSize: 9,
  },
});

interface IncentiveReportPDFProps {
  incentiveResult: IncentiveResult;
  supportValues: {
    target: {
      taxDiscount: string;
      interestSupport: string;
      cap: string;
    };
    priority: {
      taxDiscount: string;
      interestSupport: string;
      cap: string;
    };
    isCombination: boolean;
  };
}

// Helper functions
const formatPercentage = (value: string): string => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return `%${numValue.toFixed(0)}`;
};

const formatCurrency = (value: string): string => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  return `${numValue.toLocaleString('tr-TR')} TL`;
};

const IncentiveReportPDF: React.FC<IncentiveReportPDFProps> = ({ incentiveResult, supportValues }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Teşvik Sonuçları Raporu</Text>
      </View>

      {/* Sector Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{incentiveResult.sector.name}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>NACE Kodu:</Text>
          <Text style={styles.value}>{incentiveResult.sector.nace_code}</Text>
        </View>
        
        {/* Investment Type Badges */}
        <View style={styles.badgeContainer}>
          {incentiveResult.sector.isTarget && (
            <Text style={styles.badge}>• Hedef Yatırım</Text>
          )}
          {incentiveResult.sector.isPriority && (
            <Text style={styles.badge}>• Öncelikli Yatırım</Text>
          )}
          {incentiveResult.sector.isHighTech && (
            <Text style={styles.badge}>• Yüksek Teknoloji</Text>
          )}
          {incentiveResult.sector.isMidHighTech && (
            <Text style={styles.badge}>• Orta-Yüksek Teknoloji</Text>
          )}
        </View>
      </View>

      {/* Location Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lokasyon Bilgileri</Text>
        <View style={styles.row}>
          <Text style={styles.label}>İl / İlçe:</Text>
          <Text style={styles.value}>{`${incentiveResult.location.province} / ${incentiveResult.location.district}`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Bölge:</Text>
          <Text style={styles.value}>{`${incentiveResult.location.region}. Bölge`}</Text>
        </View>
        {incentiveResult.location.subregion && (
          <View style={styles.row}>
            <Text style={styles.label}>Alt Bölge:</Text>
            <Text style={styles.value}>{incentiveResult.location.subregion}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>OSB Durumu:</Text>
          <Text style={styles.value}>{incentiveResult.location.osb_status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Minimum Yatırım Tutarı:</Text>
          <Text style={styles.value}>{`${incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>SGK Destek Süresi:</Text>
          <Text style={styles.value}>{incentiveResult.location.sgk_duration}</Text>
        </View>
      </View>
      
      {/* General Supports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel Destekler</Text>
        <View style={styles.row}>
          <Text style={styles.label}>KDV İstisnası:</Text>
          <Text style={styles.value}>{incentiveResult.supports.vat_exemption ? '✓ EVET' : '✗ HAYIR'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Gümrük Muafiyeti:</Text>
          <Text style={styles.value}>{incentiveResult.supports.customs_exemption ? '✓ EVET' : '✗ HAYIR'}</Text>
        </View>
      </View>

      {/* Investment Type Supports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yatırım Türü Destekleri</Text>
        
        {incentiveResult.sector.isTarget && (
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Hedef Yatırım Destekleri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Vergi İndirim Desteği Yatırıma Katkı Oranı:</Text>
              <Text style={styles.value}>{formatPercentage(supportValues.target.taxDiscount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Faiz/Kâr Payı Desteği Oranı:</Text>
              <Text style={styles.value}>
                {supportValues.target.interestSupport.includes("N/A") ? 
                  supportValues.target.interestSupport : 
                  formatPercentage(supportValues.target.interestSupport)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Faiz/Kâr Payı Üst Limit:</Text>
              <Text style={styles.value}>
                {supportValues.target.cap.includes("N/A") ? 
                  supportValues.target.cap : 
                  formatCurrency(supportValues.target.cap)}
              </Text>
            </View>
          </View>
        )}

        {(incentiveResult.sector.isPriority || incentiveResult.sector.isHighTech || incentiveResult.sector.isMidHighTech) && (
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>Öncelikli / Teknoloji Destekleri</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Vergi İndirim Desteği Yatırıma Katkı Oranı:</Text>
              <Text style={styles.value}>{formatPercentage(supportValues.priority.taxDiscount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Faiz/Kâr Payı Desteği Oranı:</Text>
              <Text style={styles.value}>
                {supportValues.priority.interestSupport.includes("N/A") ? 
                  supportValues.priority.interestSupport : 
                  formatPercentage(supportValues.priority.interestSupport)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Faiz/Kâr Payı Üst Limit:</Text>
              <Text style={styles.value}>
                {supportValues.priority.cap.includes("N/A") ? 
                  supportValues.priority.cap : 
                  formatCurrency(supportValues.priority.cap)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Important Warning */}
      {incentiveResult.sector.isTarget && [4, 5, 6].includes(incentiveResult.location.region) && (
        <View style={styles.warning}>
          <Text>⚠️ Önemli: Faiz/Kâr Payı Desteği, sabit yatırımın %10'unu geçemez.</Text>
        </View>
      )}

      {/* Special Conditions */}
      {incentiveResult.sector.conditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Özel Şartlar ve Koşullar</Text>
          <Text>{incentiveResult.sector.conditions}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Bu rapor sistem tarafından otomatik olarak oluşturulmuştur.
        Oluşturma Tarihi: {new Date().toLocaleDateString('tr-TR')}
      </Text>
    </Page>
  </Document>
);

export default IncentiveReportPDF;