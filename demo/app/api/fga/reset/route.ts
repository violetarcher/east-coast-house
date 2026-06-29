import { NextResponse } from 'next/server';
import { getFgaClient } from '@/lib/fga';

// All tuples written during demo flows — safe to attempt deletion even if absent.
const DEMO_TUPLES = [
  // Maya conversion
  { user: 'user:maya', relation: 'homeowner', object: 'property:maple-drive' },
  // Michael authorized_rep delegations (all three possible properties)
  { user: 'user:michael', relation: 'authorized_rep', object: 'property:oak-street' },
  { user: 'user:michael', relation: 'authorized_rep', object: 'property:elm-ave' },
  { user: 'user:michael', relation: 'authorized_rep', object: 'property:maple-drive' },
];

export async function POST() {
  const client = getFgaClient();
  const errors: string[] = [];

  await Promise.all(
    DEMO_TUPLES.map(async (tuple) => {
      try {
        await client.write({ deletes: [tuple] });
      } catch (err: unknown) {
        // Ignore "not found" / "cannot delete non-existing" — tuple just wasn't written
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('cannot delete') && !msg.includes('not found') && !msg.includes('404')) {
          errors.push(`${tuple.user} ${tuple.relation} ${tuple.object}: ${msg}`);
          console.error('FGA reset delete failed:', tuple, err);
        }
      }
    })
  );

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
