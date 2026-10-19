import { getSession } from '@/lib/auth';
import { loadProgress, saveProgress } from '@/lib/family-progress';
import { parseSnapshot } from '@/lib/progress-snapshot';

/**
 * The signed-in parent's progress (src/lib/family-progress.ts), read and
 * saved by src/components/app/ProgressSync.tsx. Under /app so proxy.ts runs
 * its daily subscription re-check here too. The email always comes from the
 * signed session cookie, never from the request.
 */

const MAX_BODY = 300_000;

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'not_signed_in' }, { status: 401 });
  const snapshot = await loadProgress(session.email);
  if (!snapshot) return Response.json({ error: 'unavailable' }, { status: 503 });
  return Response.json({ snapshot });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'not_signed_in' }, { status: 401 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return Response.json({ error: 'too_large' }, { status: 413 });
  let body: { snapshot?: unknown; today?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }
  // The parent's own calendar day, so the streak matches their clock.
  const today =
    typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today) ? body.today : new Date().toISOString().slice(0, 10);
  const snapshot = await saveProgress(session.email, session.customerId, parseSnapshot(body.snapshot), today);
  if (!snapshot) return Response.json({ error: 'unavailable' }, { status: 503 });
  return Response.json({ snapshot });
}
