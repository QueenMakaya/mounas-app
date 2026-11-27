import Link from 'next/link';
import { MOBILE_MONEY_PATH } from '@/lib/config';

/**
 * « Pas de carte bancaire ? » under the Stripe trial buttons: opens the
 * no-card trial paid afterwards by Mobile Money (/mobile-money).
 */
export default function NoCardLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href={MOBILE_MONEY_PATH}
      data-track="Mobile Money cliqué"
      className={`text-sm font-bold underline underline-offset-4 ${className}`}
      style={{ color: '#115E59' }}
    >
      📱 Pas de carte bancaire ? Essai gratuit, puis Mobile Money
    </Link>
  );
}
