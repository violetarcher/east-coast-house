import { NextResponse } from 'next/server';
import { getFgaClient } from '@/lib/fga';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { checks } = body as {
      checks: Array<{ user: string; relation: string; object: string; correlationId?: string; context?: object }>;
    };

    if (!Array.isArray(checks) || checks.length === 0) {
      return NextResponse.json({ error: 'checks array required' }, { status: 400 });
    }

    const client = getFgaClient();
    const response = await client.batchCheck({ checks });

    // Return results keyed by correlationId for easy client-side lookup
    const byId = Object.fromEntries(
      response.result.map((r) => [r.correlationId, { allowed: r.allowed, request: r.request }])
    );

    return NextResponse.json({ results: byId, raw: response.result });
  } catch (err) {
    console.error('FGA batchCheck error:', err);
    return NextResponse.json({ error: 'FGA batchCheck failed' }, { status: 500 });
  }
}
