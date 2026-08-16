'use client';

import { useEffect, useState } from 'react';

type Props = {
  activityId: string;
};

const getKey = (activityId: string) => {
  const today = new Date().toISOString().slice(0, 10);
  return `mounas_completed_${activityId}_${today}`;
};

export default function CompleteButton({ activityId }: Props) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(getKey(activityId)) === 'true') {
      setIsCompleted(true);
    }
  }, [activityId]);

  const handleClick = () => {
    localStorage.setItem(getKey(activityId), 'true');
    setIsCompleted(true);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isCompleted ? (
        <button
          disabled
          className="rounded-full px-8 py-4 font-bold text-base cursor-not-allowed"
          style={{ backgroundColor: '#D3D1C7', color: '#5F5E5A' }}
        >
          ✓ Activité terminée aujourd’hui
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="rounded-full px-8 py-4 font-bold text-base shadow-lg transition-colors duration-200 bg-[#E63946] hover:bg-red-700"
          style={{ color: '#FDF6EC' }}
        >
          ✓ J’ai fait l’activité avec mon enfant
        </button>
      )}

      <div
        className="rounded-xl px-6 py-3 text-sm font-semibold text-center transition-opacity duration-500"
        style={{
          backgroundColor: '#F4A340',
          color: '#1A1A1A',
          opacity: showCelebration ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        🎉 Bravo ! Reviens demain pour une nouvelle activité 🌟
      </div>
    </div>
  );
}
