import { NextResponse } from 'next/server';
import { getFgaClient } from '@/lib/fga';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, relation, object, condition } = body;

    if (!user || !relation || !object) {
      return NextResponse.json({ error: 'user, relation, object required' }, { status: 400 });
    }

    const client = getFgaClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tuple: any = { user, relation, object };
    if (condition) tuple.condition = condition;

    await client.write({ writes: [tuple] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('FGA write error:', err);
    return NextResponse.json({ error: 'FGA write failed' }, { status: 500 });
  }
}
