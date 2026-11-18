import {
  DocumentSnapshot,
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/config/firebase';

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: number | null;
  lastSenderId: string | null;
  unread: Record<string, number>;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: number;
};

// Required format by firestore.rules: <listingId>_<buyerId>
export const conversationId = (listingId: string, buyerId: string) => `${listingId}_${buyerId}`;

export function parseConversation(snap: DocumentSnapshot): Conversation {
  const x = snap.data() ?? {};
  return {
    id: snap.id,
    listingId: x.listingId ?? '',
    listingTitle: x.listingTitle ?? '',
    buyerId: x.buyerId ?? '',
    sellerId: x.sellerId ?? '',
    buyerName: x.buyerName ?? 'Utilisateur',
    sellerName: x.sellerName ?? 'Annonceur',
    lastMessage: x.lastMessage ?? '',
    lastMessageAt: x.lastMessageAt?.toMillis?.() ?? null,
    lastSenderId: x.lastSenderId ?? null,
    unread: x.unread ?? {},
  };
}

export const otherName = (c: Conversation, myUid: string) =>
  c.buyerId === myUid ? c.sellerName : c.buyerName;

type CreateParams = {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
};

// Creates the conversation document (must exist before the first message).
export async function createConversation(p: CreateParams): Promise<void> {
  let sellerName = 'Annonceur';
  try {
    const s = await getDoc(doc(db, 'users', p.sellerId));
    const n = s.data()?.fullName;
    if (typeof n === 'string' && n) sellerName = n;
  } catch {
    // keep the default name
  }

  await setDoc(doc(db, 'conversations', conversationId(p.listingId, p.buyerId)), {
    listingId: p.listingId,
    listingTitle: p.listingTitle,
    buyerId: p.buyerId,
    sellerId: p.sellerId,
    participants: [p.buyerId, p.sellerId], // same order as the rules expect
    buyerName: p.buyerName,
    sellerName,
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastSenderId: null,
    unread: { [p.buyerId]: 0, [p.sellerId]: 0 },
  });
}

export async function sendMessage(convId: string, senderId: string, content: string) {
  await addDoc(collection(db, 'conversations', convId, 'messages'), {
    senderId,
    content,
    createdAt: serverTimestamp(),
  });
}

// Rule (a): a participant can only reset his own unread counter.
export async function markRead(convId: string, myUid: string) {
  try {
    await updateDoc(doc(db, 'conversations', convId), { [`unread.${myUid}`]: 0 });
  } catch {
    // not critical
  }
}