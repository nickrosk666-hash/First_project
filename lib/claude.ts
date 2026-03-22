import https from 'https';

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  system?: string;
}

export function callClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 4000,
    system,
  } = options;

  return new Promise((resolve, reject) => {
    const payload: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    };
    if (system) payload.system = system;

    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) =>
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        );
        res.on('end', () => {
          const d = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200)
            return reject(new Error(`Claude API ${res.statusCode}: ${d}`));
          try {
            resolve(JSON.parse(d).content[0].text.trim());
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

export function callClaudeChat(
  messages: { role: string; content: string }[],
  system: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = 'claude-haiku-4-5-20251001',
    maxTokens = 1024,
  } = options;

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, max_tokens: maxTokens, system, messages });
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) =>
          chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
        );
        res.on('end', () => {
          const d = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode !== 200)
            return reject(new Error(`Claude API ${res.statusCode}: ${d}`));
          try {
            resolve(JSON.parse(d).content[0].text.trim());
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

export const WEIGHTS: Record<string, number> = {
  market: 0.15,
  automation: 0.15,
  pain: 0.20,
  competition: 0.10,
  willingnessToPay: 0.15,
  margin: 0.10,
  build: 0.08,
  timing: 0.07,
};

export function computeComposite(
  scores: Record<string, { value: number }>
): number {
  let composite = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    composite += (scores[k]?.value ?? 0) * w;
  }
  return Math.round(composite * 10) / 10;
}

export function getVerdict(score: number): string {
  if (score >= 7.5) return 'BUILD';
  if (score >= 6.0) return 'BET';
  if (score >= 4.0) return 'FLIP';
  return 'KILL';
}