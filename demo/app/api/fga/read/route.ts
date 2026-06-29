import { NextResponse } from 'next/server';
import { getFgaClient } from '@/lib/fga';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get('user') ?? undefined;
    const relation = searchParams.get('relation') ?? undefined;
    const object = searchParams.get('object') ?? undefined;

    const client = getFgaClient();
    const result = await client.read({
      ...(user ? { user } : {}),
      ...(relation ? { relation } : {}),
      ...(object ? { object } : {}),
    });
    return NextResponse.json({ tuples: result.tuples ?? [] });
  } catch (err) {
    console.error('FGA read error:', err);
    return NextResponse.json({ error: 'FGA read failed' }, { status: 500 });
  }
}
