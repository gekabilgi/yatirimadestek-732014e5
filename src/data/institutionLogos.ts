export interface InstitutionLogo {
  id: string;
  name: string;
  logoPath: string;
  category: "ministry" | "agency" | "development" | "other";
}

export const institutionLogos: InstitutionLogo[] = [
  {
    id: "tkdk",
    name: "TKDK (Tarım ve Kırsal Kalkınmayı Destekleme Kurumu)",
    logoPath: "/img/instlogo/tkdk.png",
    category: "agency",
  },
  { id: "iskur", name: "İŞKUR (Türkiye İş Kurumu)", logoPath: "/img/instlogo/iskur.png", category: "agency" },
  { id: "bigg", name: "BİGG (Bireysel Genç Girişimci)", logoPath: "/img/image.png", category: "other" },
  {
    id: "kosgeb",
    name: "KOSGEB (Küçük ve Orta Ölçekli İşletmeleri Geliştirme ve Destekleme İdaresi Başkanlığı)",
    logoPath: "/img/instlogo/kosgeb.png",
    category: "agency",
  },
  {
    id: "tubitak",
    name: "TÜBİTAK (Türkiye Bilimsel ve Teknolojik Araştırma Kurumu)",
    logoPath: "/img/image.png",
    category: "other",
  },
  { id: "sanayi", name: "Sanayi ve Teknoloji Bakanlığı", logoPath: "/img/instlogo/sanayi.png", category: "ministry" },
  {
    id: "aile",
    name: "Aile ve Sosyal Hizmetler Bakanlığı",
    logoPath: "/img/instlogo/aile.jpg",
    category: "development",
  },
];
