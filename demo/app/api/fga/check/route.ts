import { NextResponse } from 'next/server';
import { fgaCheck } from '@/lib/fga';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, relation, object, context } = body;

    if (!user || !relation || !object) {
      return NextResponse.json({ error: 'user, relation, object required' }, { status: 400 });
    }

    const result = await fgaCheck(user, relation, object, context);
    return NextResponse.json(result);
  } catch (err) {
    console.error('FGA check error:', err);
    return NextResponse.json({ error: 'FGA check failed' }, { status: 500 });
  }
}
