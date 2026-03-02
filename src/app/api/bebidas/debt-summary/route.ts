import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const sums: Record<string, number> = {};
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin
      .from('bebidas')
      .select('name, price')
      .is('paid', null)
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    (data ?? []).forEach((row) => {
      if (!sums[row.name]) sums[row.name] = 0;
      sums[row.name] += Number(row.price);
    });

    hasMore = (data?.length ?? 0) === pageSize;
    from += pageSize;
  }

  const result = Object.entries(sums)
    .map(([name, sumPrice]) => ({ name, sumPrice }))
    .sort((a, b) => b.sumPrice - a.sumPrice);

  return NextResponse.json(result);
}
