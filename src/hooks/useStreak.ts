import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { updateStreak, type AwardedBadge } from '@/lib/gamification';

export function useStreak() {
  const { user } = useAuth();
  const checked = useRef(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [badgesEarned, setBadgesEarned] = useState<AwardedBadge[]>([]);

  useEffect(() => {
    if (!user?.id || checked.current) return;
    checked.current = true;

    updateStreak(user.id).then((result) => {
      setCurrentStreak(result.currentStreak);
      setIsActive(true);
      setBadgesEarned(result.badgesEarned);
    });
  }, [user?.id]);

  return { currentStreak, isActive, badgesEarned };
}
