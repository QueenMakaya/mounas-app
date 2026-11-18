'use client';

import { useEffect } from 'react';
import { markExpoVisit } from '@/lib/expo-client';

/** Placed on /expo: notes the visit so the rest of the site keeps showing the salon offer. */
export default function ExpoMark() {
  useEffect(markExpoVisit, []);
  return null;
}
