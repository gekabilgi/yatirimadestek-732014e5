import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { IncentiveResult } from '@/types/incentive';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    color: '#333',
  },
  header: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: 15,
    textAlign: 'center',
    marginBottom: 20,
    borderRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
    padding: 15,
    border: '1px solid #eee',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007bff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    borderBottom: '1px dotted #ccc',
    paddingBottom: 5,
  },
  label: {
    color: '#555',
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  badge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    padding: '3px 8px',
    borderRadius: 3,
    fontSize: 9,
    marginRight: 5,
    marginBottom: 5,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#aaa',
    fontSize: 9,
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: '#856404',
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
            <Text style={styles.badge}>🎯 Hedef Yatırım</Text>
          )}
          {incentiveResult.sector.isPriority && (
            <Text style={styles.badge}>📌 Öncelikli Yatırım</Text>
          )}
          {incentiveResult.sector.isHighTech && (
            <Text style={styles.badge}>💡 Yüksek Teknoloji</Text>
          )}
          {incentiveResult.sector.isMidHighTech && (
            <Text style={styles.badge}>🔧 Orta-Yüksek Teknoloji</Text>
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
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 12 }}>Hedef Yatırım Destekleri</Text>
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
          <View>
            <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 12 }}>Öncelikli / Teknoloji Destekleri</Text>
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