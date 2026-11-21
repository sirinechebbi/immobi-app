import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';

// Total of unread messages across all my conversations
export function useUnreadCount(): number {
  const uid = useAuthStore((s) => s.user?.uid);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      return;
    }
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid));
    return onSnapshot(
      q,
      (snap) => {
        let n = 0;
        snap.forEach((d) => {
          n += Number(d.data().unread?.[uid] ?? 0);
        });
        setCount(n);
      },
      () => setCount(0)
    );
  }, [uid]);

  return count;
}