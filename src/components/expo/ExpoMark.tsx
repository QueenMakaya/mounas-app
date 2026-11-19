'use client';

import { useEffect } from 'react';
import { markExpoVisit } from '@/lib/expo-client';

/** Placed on /abidjan: notes the visit so the rest of the site keeps showing the launch offer. */
export default function ExpoMark() {
  useEffect(markExpoVisit, []);
  return null;
}
