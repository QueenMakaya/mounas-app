import { after } from 'next/server';
import { funnelRow, logFunnel, type FunnelPayload } from '@/lib/funnel-log';

/**
 * POST /api/parcours: one step of the sign-up path (src/lib/funnel-log.ts),
 * sent by the browser with navigator.sendBeacon so it survives the page
 * leaving for Stripe. Answers at once; the Airtable row is written after.
 */

const MAX_BODY = 4_000;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });
  let payload: FunnelPayload;
  try {
    payload = JSON.parse(raw) as FunnelPayload;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!payload || typeof payload !== 'object') return new Response(null, { status: 400 });

  const row = funnelRow(payload, request.headers.get('user-agent') ?? '', request.headers.get('x-vercel-ip-country') ?? '');
  if (!row) return new Response(null, { status: 400 });

  after(() => logFunnel(row));
  return new Response(null, { status: 204 });
}
