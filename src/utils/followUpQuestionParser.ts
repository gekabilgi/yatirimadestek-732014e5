/**
 * Takip sorularını ve destek programı bildirimlerini ana içerikten ayıran utility
 */

export interface ParsedContent {
  mainContent: string;
  followUpQuestion: string | null;
  supportCardsNotice: string | null;
}

/**
 * AI mesajındaki takip sorusunu ve destek programı bildirimini tespit edip ayırır
 */
export function extractFollowUpQuestion(content: string): ParsedContent {
  let workingContent = content;
  let supportCardsNotice: string | null = null;

  // Önce "Ayrıca aşağıdaki..." destek programı bildirimini ayır
  const supportNoticePatterns = [
    /\n*---\n*📋?\s*\*\*Ayrıca aşağıdaki[^*]*\*\*:?\s*$/i,
    /\n*📋\s*\*\*Ayrıca aşağıdaki[^*]*\*\*:?\s*$/i,
    /\n*---\n*📋?\s*Ayrıca aşağıdaki[^\n]*:?\s*$/i,
  ];

  for (const pattern of supportNoticePatterns) {
    if (pattern.test(workingContent)) {
      supportCardsNotice = "Ayrıca aşağıdaki güncel destek programları da ilginizi çekebilir";
      workingContent = workingContent.replace(pattern, '').trim();
      break;
    }
  }

  // Öncelik 1: Bold işaretli takip sorusu - "**...planlıyorsunuz?** ---?" formatı
  const boldQuestionPattern = /\n*\*\*([^*]+(?:planlıyorsunuz|belirtir misiniz|ister misiniz|paylaşır mısınız|söyler misiniz|bildirir misiniz))\??\*\*\s*(?:---\?)?\s*$/i;
  const boldMatch = workingContent.match(boldQuestionPattern);
  if (boldMatch) {
    const question = boldMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = workingContent.replace(boldQuestionPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
  }

  // Öncelik 2: Bold başlangıçlı sorular - "**Bu yatırımı hangi ilde...**" formatı
  const boldStartPattern = /\n*\*\*(Bu|Hangi|Lütfen)[^*]+\*\*\s*(?:---\?)?\s*$/i;
  const boldStartMatch = workingContent.match(boldStartPattern);
  if (boldStartMatch) {
    const fullMatch = boldStartMatch[0];
    const question = fullMatch.replace(/^\n*\*\*/, '').replace(/\*\*\s*(?:---\?)?\s*$/, '').trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = workingContent.replace(boldStartPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
  }

  // Öncelik 3: "### 💬 Devam Etmek İçin" başlığı + ayrı satırda soru (bold veya düz)
  // Format: "### 💬 Devam Etmek İçin\n\n**Bu yatırımı...**" veya "### 💬 Devam Etmek İçin\n\nBu yatırımı..."
  const headerWithNewlineQuestionPattern = /\.?\s*###\s*💬?\s*Devam Etmek İçin\s*\n+\**([^*\n]+(?:planlıyorsunuz|misiniz|musunuz|mısınız)?)\??\**\s*$/i;
  const headerNewlineMatch = workingContent.match(headerWithNewlineQuestionPattern);
  if (headerNewlineMatch) {
    const question = headerNewlineMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = workingContent.replace(headerWithNewlineQuestionPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
  }

  // Öncelik 4: API'den gelen özel format - "### 💬 Devam Etmek İçin" + soru (aynı satırda veya tek newline)
  const specialFormatPattern = /\.?\s*###\s*💬?\s*Devam Etmek İçin\s*\n?\**([^*\n]+)\**\s*$/i;
  const specialMatch = workingContent.match(specialFormatPattern);
  if (specialMatch) {
    const question = specialMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = workingContent.replace(specialFormatPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
  }

  // Öncelik 5: Sadece "### 💬 Devam Etmek İçin" başlığı (soru ayrı satırda veya yok)
  const headerOnlyPattern = /\.?\s*###\s*💬?\s*Devam Etmek İçin\s*$/i;
  if (headerOnlyPattern.test(workingContent)) {
    const mainContent = workingContent.replace(headerOnlyPattern, '').trim();
    return { mainContent, followUpQuestion: "Bu yatırımı hangi ilde yapmayı planlıyorsunuz?", supportCardsNotice };
  }

  // Öncelik 6: Inline format - "### 💬 Devam Etmek İçin Bu yatırımı..." (satır sonu olmadan)
  const inlineFormatPattern = /\.?\s*###\s*💬?\s*Devam Etmek İçin\s+(.+?)$/i;
  const inlineMatch = workingContent.match(inlineFormatPattern);
  if (inlineMatch) {
    const question = inlineMatch[1].trim();
    const formattedQuestion = question.endsWith('?') ? question : question + '?';
    const mainContent = workingContent.replace(inlineFormatPattern, '').trim();
    return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
  }

  // Öncelik 7: Standart takip sorusu pattern'leri
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
    const match = workingContent.match(pattern);
    if (match) {
      const question = match[1].trim();
      const formattedQuestion = question.endsWith('?') ? question : question + '?';
      const mainContent = workingContent.replace(pattern, '').trim();
      return { mainContent, followUpQuestion: formattedQuestion, supportCardsNotice };
    }
  }

  return { mainContent: workingContent, followUpQuestion: null, supportCardsNotice };
}
