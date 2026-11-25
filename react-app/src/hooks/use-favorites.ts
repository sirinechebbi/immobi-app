
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';

export function useFavorites() {
  const user = useAuthStore((state) => state.user);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }

    setLoading(true);

    const favoriteRef = doc(db, 'users', user.uid, 'private', 'favorites');

    const unsubscribe = onSnapshot(
      favoriteRef,
      (snapshot) => {
        const data = snapshot.data();
        setIds(new Set(data?.listingIds ?? []));
        setLoading(false);
      },
      (error) => {
        console.error('Favorites error:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const toggle = async (id: string) => {
    if (!user) return;

    const favoriteRef = doc(db, 'users', user.uid, 'private', 'favorites');
    const nextIds = new Set(ids);

    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }

    await setDoc(favoriteRef, {
      listingIds: Array.from(nextIds),
    }, { merge: true });
  };

  return {
    ids,
    toggle,
    signedIn: !!user,
    loading,
  };
}
