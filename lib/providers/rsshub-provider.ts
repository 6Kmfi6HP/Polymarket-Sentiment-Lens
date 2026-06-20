import { withTimeout } from '../utils/timeout';
import { withRetry } from '../utils/retry';
import { normalizeUrl } from '../utils/normalize';

export interface NewsItemDTO {
  title: string;
  summary?: string | null;
  url: string;
  publishedAt?: Date | null;
  rawJson?: string;
}

export class RSSHubProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.RSSHUB_BASE_URL || 'http://orangepi:1200';
  }

  /**
   * Fetches the RSS XML feed from RSSHub and parses the item tags into NewsItemDTOs.
   */
  async fetchFeed(path: string): Promise<NewsItemDTO[]> {
    // Standard URL joining, ensuring no double-slashes
    const cleanBase = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanBase}${cleanPath}`;

    const fetchFn = async () => {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (!res.ok) {
        throw new Error(`RSSHub request failed with status: ${res.status}`);
      }
      return res.text();
    };

    try {
      // 10 second timeout for RSSHub
      const xmlText = await withRetry(
        () => withTimeout(fetchFn(), 10000, `RSSHub timeout for URL: ${url}`),
        2,
        500
      );

      return this.parseRSSXML(xmlText);
    } catch (err) {
      console.warn(`[RSSHubProvider] Failed to fetch feed for path [${path}]. Trying fallback public feed.`, err);
      
      // If our internal RSSHub at orangepi:1200 fails, we can fall back to public rsshub.app
      // or public Google News RSS as backup if needed! This ensures extreme reliability in sandbox.
      try {
        const publicUrl = `https://rsshub.app${cleanPath}`;
        const fallbackFetch = async () => {
          const res = await fetch(publicUrl, {
            headers: { 'Accept': 'application/xml, text/xml, */*', 'User-Agent': 'Mozilla/5.0' },
          });
          if (!res.ok) throw new Error(`Public RSSHub fallback failed: ${res.status}`);
          return res.text();
        };
        const xmlText = await withTimeout(fallbackFetch(), 8000, 'Public RSSHub fallback timeout');
        return this.parseRSSXML(xmlText);
      } catch (fallbackErr) {
        console.error('[RSSHubProvider] Fallback public feed also failed:', fallbackErr);
        return [];
      }
    }
  }

  /**
   * Fast, reliable regex-based XML parser for standard RSS 2.0 Feeds.
   * Handles CDATA tags and encodes entity entities successfully.
   */
  private parseRSSXML(xml: string): NewsItemDTO[] {
    const items: NewsItemDTO[] = [];
    
    // Split XML by <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
      const content = match[1];
      
      const title = this.extractTagContent(content, 'title');
      const link = this.extractTagContent(content, 'link') || this.extractTagContent(content, 'guid');
      const description = this.extractTagContent(content, 'description') || this.extractTagContent(content, 'summary') || this.extractTagContent(content, 'content:encoded');
      const pubDateStr = this.extractTagContent(content, 'pubDate') || this.extractTagContent(content, 'dc:date');
      
      if (!title || !link) continue;

      let publishedAt: Date | null = null;
      if (pubDateStr) {
        const d = new Date(pubDateStr);
        if (!isNaN(d.getTime())) {
          publishedAt = d;
        }
      }

      items.push({
        title: this.cleanCDATAAndEntities(title),
        summary: this.cleanCDATAAndEntities(description ? description.slice(0, 300) : ''),
        url: normalizeUrl(this.cleanCDATAAndEntities(link)),
        publishedAt,
        rawJson: JSON.stringify({ title, link, pubDateStr, description: description ? description.slice(0, 1000) : '' }),
      });
    }

    return items;
  }

  private extractTagContent(xmlBlock: string, tagName: string): string | null {
    // Matches standard open/close tag or self-closing
    // E.g., <title>Some Title</title> or <title><![CDATA[Some Title]]></title>
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i');
    const match = regex.exec(xmlBlock);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }

  private cleanCDATAAndEntities(text: string): string {
    if (!text) return '';
    
    // Strip CDATA wrapper
    let clean = text;
    if (clean.includes('<![CDATA[')) {
      clean = clean.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
    }
    
    // Replace standard XML entities
    return clean
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/<[^>]*>/g, '') // Strip stray HTML tags
      .trim();
  }
}
