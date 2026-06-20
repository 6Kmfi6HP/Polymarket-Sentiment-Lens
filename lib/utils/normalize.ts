export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    // Strip trailing slashes
    let normalized = parsed.toString().trim();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return url.trim();
  }
}

export function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    'will', 'the', 'hit', 'by', 'in', 'before', 'after', 'to', 'be', 'a', 'an', 'is', 'on', 'at', 'of', 'for', 'with', 'that', 'this', 'have', 'has', 'had', 'or', 'and', 'not', 'but', 'if', 'then', 'else', 'shall', 'would', 'should', 'could', 'may', 'might', 'must', 'who', 'what', 'when', 'where', 'why', 'how', 'which', 'about', 'as', 'into', 'over', 'under', 'again', 'once', 'there', 'their', 'them', 'they'
  ]);
  
  const tickerMap: Record<string, string> = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'solana': 'SOL',
    'ripple': 'XRP',
    'cardano': 'ADA',
    'dogecoin': 'DOGE',
    'polkadot': 'DOT',
  };

  // Replace special characters except dollar sign (useful for assets)
  const cleanText = question.replace(/[^a-zA-Z0-9$_\s-]/g, ' ');
  const words = cleanText.split(/\s+/).map(w => w.trim()).filter(Boolean);

  const keywords: string[] = [];
  const lowercaseSeen = new Set<string>();

  for (const word of words) {
    const wLower = word.toLowerCase();
    if (stopWords.has(wLower)) continue;
    if (wLower.length <= 2) continue;
    if (/^\d+$/.test(word)) continue; // skip pure numbers
    
    if (lowercaseSeen.has(wLower)) continue;
    lowercaseSeen.add(wLower);

    // If matches a major name, push its symbol too
    if (tickerMap[wLower]) {
      keywords.push(tickerMap[wLower]);
    }
    keywords.push(word);
  }

  return Array.from(new Set(keywords)).slice(0, 5);
}
export function getCleanDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
