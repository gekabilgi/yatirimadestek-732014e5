// components/IncentiveReportPDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { IncentiveResult } from '@/types/incentive';

// Register a font that supports Turkish characters and bold weight.
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf' },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

// A professional and clean color palette
const colors = {
  primary: '#2c3e50', // Dark Slate Blue
  secondary: '#34495e', // Lighter Slate Blue
  accent: '#e67e22', // Orange for alerts
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#bdc3c7',
  backgroundLight: '#ecf0f1',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans',
    fontSize: 10,
    padding: 35,
    color: colors.textPrimary,
    backgroundColor: '#fff',
  },
  header: {
    paddingBottom: 10,
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  reportDate: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 5,
  },
  // -- SECTIONS & CARDS --
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  // -- INFO BOXES (Conditions & Alert) --
  conditionsBox: {
    backgroundColor: '#fef9e7', // Light yellow
    borderColor: '#f1c40f',
  },
  alertBox: {
    backgroundColor: '#fdedec', // Light red
    borderColor: '#e74c3c',
    paddingLeft: 12, // Indent text
    borderLeftWidth: 4, // Add colored left border
  },
  infoBoxTitle: {
    color: colors.accent,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  // -- ROWS & LABELS --
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  label: {
    color: colors.textSecondary,
  },
  value: {
    fontWeight: 'bold',
    maxWidth: '60%', // Prevent long text from breaking layout
    textAlign: 'right',
  },
});

// Helper function to derive support values
const getSupportValues = (incentiveResult: IncentiveResult) => {
    const { region } = incentiveResult.location;
    const { isTarget } = incentiveResult.sector;
    const targetSupports = { taxDiscount: "20", interestSupport: "N/A", cap: "N/A" };
    if (isTarget && [4, 5, 6].includes(region)) {
        targetSupports.interestSupport = "25";
        targetSupports.cap = "12000000";
    }
    const prioritySupports = { taxDiscount: "30", interestSupport: "25", cap: "24000000" };
    return { target: targetSupports, priority: prioritySupports };
};

interface IncentiveReportProps {
  incentiveResult: IncentiveResult;
}

const IncentiveReportPDF: React.FC<IncentiveReportProps> = ({ incentiveResult }) => {
  const supportValues = getSupportValues(incentiveResult);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <Text style={styles.reportTitle}>Teşvik Sonuçları Raporu</Text>
            <Text style={styles.reportDate}>Oluşturma Tarihi: {new Date().toLocaleDateString('tr-TR')}</Text>
        </View>

        {/* Yatırım Künyesi Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Yatırım Künyesi</Text>
            <View style={styles.row}><Text style={styles.label}>Faaliyet Konusu</Text><Text style={styles.value}>{incentiveResult.sector.name}</Text></View>
            <View style={styles.row}><Text style={styles.label}>NACE Kodu</Text><Text style={styles.value}>{incentiveResult.sector.nace_code}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Lokasyon</Text><Text style={styles.value}>{incentiveResult.location.province} / {incentiveResult.location.district}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Bölge</Text><Text style={styles.value}>{incentiveResult.location.region}. Bölge</Text></View>
            <View style={styles.row}><Text style={styles.label}>Alt Bölge</Text><Text style={styles.value}>{incentiveResult.location.subregion || 'Yok'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Min. Yatırım Tutarı</Text><Text style={styles.value}>{incentiveResult.sector.minInvestment?.toLocaleString('tr-TR')} TL</Text></View>
        </View>

        {/* Destekler Card */}
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Destek Unsurları</Text>
            {/* Genel Destekler */}
            <View style={styles.row}><Text style={styles.label}>KDV İstisnası</Text><Text style={styles.value}>{incentiveResult.supports.vat_exemption ? 'EVET' : 'HAYIR'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Gümrük Muafiyeti</Text><Text style={styles.value}>{incentiveResult.supports.customs_exemption ? 'EVET' : 'HAYIR'}</Text></View>
            
            {/* Yatırım Türü Destekleri */}
            {incentiveResult.sector.isTarget && (
              <>
                <View style={styles.row}><Text style={styles.label}>SGK Desteği (Hedef)</Text><Text style={styles.value}>{incentiveResult.location.sgk_duration}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Vergi İndirimi (Hedef)</Text><Text style={styles.value}>%{supportValues.target.taxDiscount}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Faiz/Kâr Payı (Hedef)</Text><Text style={styles.value}>{supportValues.target.interestSupport !== "N/A" ? `%${supportValues.target.interestSupport}` : 'Uygulanmaz'}</Text></View>
              </>
            )}
            {incentiveResult.sector.isPriority && (
              <>
                <View style={styles.row}><Text style={styles.label}>SGK Desteği (Öncelikli)</Text><Text style={styles.value}>{incentiveResult.location.sgk_duration}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Vergi İndirimi (Öncelikli)</Text><Text style={styles.value}>%{supportValues.priority.taxDiscount}</Text></View>
                <View style={styles.row}><Text style={styles.label}>Faiz/Kâr Payı (Öncelikli)</Text><Text style={styles.value}>%{supportValues.priority.interestSupport}</Text></View>
              </>
            )}
        </View>
        
        {/* Önemli Bilgi Alert Box (Conditional) */}
        {incentiveResult.sector.isTarget && [1, 2, 3].includes(incentiveResult.location.region) && (
          <View style={[styles.card, styles.alertBox]}>
            <Text style={[styles.cardTitle, styles.infoBoxTitle]}>Önemli Bilgi</Text>
            <Text style={styles.infoBoxText}>Hedef sektörler için Faiz/Kar Payı Desteği 1., 2. ve 3. bölgelerde uygulanmamaktadır.</Text>
          </View>
        )}

        {/* Özel Şartlar ve Koşullar Box (Conditional) */}
        {incentiveResult.sector.conditions && (
          <View style={[styles.card, styles.conditionsBox]}>
            <Text style={[styles.cardTitle, styles.infoBoxTitle]}>Özel Şartlar ve Koşullar</Text>
            <Text style={styles.infoBoxText}>{incentiveResult.sector.conditions}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default IncentiveReportPDF;