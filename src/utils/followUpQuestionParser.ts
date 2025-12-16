/**
 * Takip sorularını ana içerikten ayıran utility
 */

export interface ParsedContent {
  mainContent: string;
  followUpQuestion: string | null;
}

/**
 * AI mesajındaki takip sorusunu tespit edip ayırır
 */
export function extractFollowUpQuestion(content: string): ParsedContent {
  // Öncelik 1: API'den gelen özel format - "### 💬 Devam Etmek İçin" başlığı
  const specialFormatPattern = /[.\s]*###\s*💬?\s*Devam Etmek İçin\s*\n?\**([^*\n]+)\**\s*$/i;
  const specialMatch = content.match(specialFormatPattern);
  if (specialMatch) {
    const question = specialMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = content.replace(specialFormatPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion };
  }

  // Öncelik 2: Inline format - "### 💬 Devam Etmek İçin Bu yatırımı..." (satır sonu olmadan)
  const inlineFormatPattern = /[.\s]*###\s*💬?\s*Devam Etmek İçin\s*(.+?)\??\s*$/i;
  const inlineMatch = content.match(inlineFormatPattern);
  if (inlineMatch) {
    const question = inlineMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = content.replace(inlineFormatPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion };
  }

  // Öncelik 3: Standart takip sorusu pattern'leri
  const patterns = [
    // "...planlıyorsunuz?" tarzı sorular
    /\n\n([^.!?\n]*(?:planlıyorsunuz|belirtir misiniz|ister misiniz|paylaşır mısınız|söyler misiniz|bildirir misiniz|bildirmeniz|paylaşmanız)\??)\s*$/i,
    // "Bu yatırımı hangi ilde..." tarzı sorular
    /\n\n((?:Bu|Hangi|Lütfen)[^.!?\n]*(?:il|sektör|ilçe|OSB|bölge)[^.!?\n]*\??)\s*$/i,
    // "Hangi ..." ile başlayan sorular
    /\n\n(Hangi\s+[^.!?\n]+\??)\s*$/i,
    // "OSB içi/dışı..." tarzı sorular
    /\n\n([^.!?\n]*OSB[^.!?\n]*\??)\s*$/i,
    // Genel soru kalıpları - son satırda soru işareti olan cümleler
    /\n\n([^.!?\n]{20,}(?:mı|mi|mu|mü|musunuz|misiniz|nedir|nelerdir)\??)\s*$/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const question = match[1].trim();
      const formattedQuestion = question.endsWith('?') ? question : question + '?';
      const mainContent = content.replace(pattern, '').trim();
      return { mainContent, followUpQuestion: formattedQuestion };
    }
  }

  return { mainContent: content, followUpQuestion: null };
}
