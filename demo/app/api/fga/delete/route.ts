import { NextResponse } from 'next/server';
import { getFgaClient } from '@/lib/fga';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, relation, object } = body;

    if (!user || !relation || !object) {
      return NextResponse.json({ error: 'user, relation, object required' }, { status: 400 });
    }

    const client = getFgaClient();
    await client.write({ deletes: [{ user, relation, object }] });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('FGA delete error:', err);
    return NextResponse.json({ error: 'FGA delete failed' }, { status: 500 });
  }
}
