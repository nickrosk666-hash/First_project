import https from 'https';

export interface SearchResult {
  url: string;
  title: string;
  markdown: string;
  description?: string;
}

export function firecrawlSearch(
  query: string,
  options: { limit?: number } = {}
): Promise<SearchResult[]> {
  const { limit = 5 } = options;

  return new Promise((resolve, reject) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return reject(new Error('FIRECRAWL_API_KEY not set'));

    const body = JSON.stringify({
      query,
      limit,
      scrapeOptions: { formats: ['markdown'] },
    });

    const req = https.request(
      {
        hostname: 'api.firecrawl.dev',
        path: '/v1/search',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) =>
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        );
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200) {
            return reject(
              new Error(`Firecrawl ${res.statusCode}: ${raw.slice(0, 300)}`)
            );
          }
          try {
            const parsed = JSON.parse(raw);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (parsed.data || []).map((item: any) => ({
              url: item.url || '',
              title: item.title || item.metadata?.title || '',
              markdown: item.markdown || '',
              description: item.description || item.metadata?.description || '',
            }));
            resolve(data);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function firecrawlBatchSearch(
  queries: string[],
  options: { limit?: number; batchSize?: number } = {}
): Promise<Map<string, SearchResult[]>> {
  const { limit = 5, batchSize = 4 } = options;
  const results = new Map<string, SearchResult[]>();

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const promises = batch.map(async (q) => {
      try {
        const res = await firecrawlSearch(q, { limit });
        return { query: q, results: res };
      } catch {
        return { query: q, results: [] };
      }
    });
    const settled = await Promise.all(promises);
    for (const { query, results: r } of settled) {
      results.set(query, r);
    }
  }

  return results;
}