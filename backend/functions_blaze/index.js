const { setGlobalOptions } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated, onDocumentWritten, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const functionsV1 = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { geohashForLocation, geohashQueryBounds, distanceBetween } = require('geofire-common');

const REGION = 'europe-west1';
setGlobalOptions({ region: REGION, maxInstances: 10 });

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = admin.firestore;

// 1. Création automatique du profil à l'inscription
exports.onUserCreated = functionsV1.region(REGION).auth.user().onCreate(async (user) => {
  await db.doc(`users/${user.uid}`).set(
    {
      fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'Utilisateur'),
      avatarUrl: user.photoURL || null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});

// 2. Champs calculés d'une annonce (geohash, titleLower, coverUrl)
exports.onListingWritten = onDocumentWritten('listings/{id}', async (event) => {
  const after = event.data && event.data.after;
  if (!after || !after.exists) return;
  const d = after.data();
  const patch = {};

  if (typeof d.lat === 'number' && typeof d.lng === 'number') {
    const gh = geohashForLocation([d.lat, d.lng]);
    if (d.geohash !== gh) patch.geohash = gh;
  }
  const lower = (d.title || '').toLowerCase();
  if (d.titleLower !== lower) patch.titleLower = lower;

  const cover = (Array.isArray(d.photos) && d.photos[0]) || null;
  if ((d.coverUrl || null) !== cover) patch.coverUrl = cover;

  if (Object.keys(patch).length) await after.ref.update(patch);
});

// Suppression des photos quand une annonce est supprimée
exports.onListingDeleted = onDocumentDeleted('listings/{id}', async (event) => {
  const d = event.data && event.data.data();
  if (!d) return;
  await admin.storage().bucket().deleteFiles({
    prefix: `listings/${d.ownerId}/${event.params.id}/`,
  });
});

// 3. Compteur de vues
exports.incrementViews = onCall(async (req) => {
  const id = req.data && req.data.listingId;
  if (!id) throw new HttpsError('invalid-argument', 'listingId requis');
  await db.doc(`listings/${id}`).update({ viewsCount: FieldValue.increment(1) });
  return { ok: true };
});

// 4. Recherche
function matches(d, p) {
  if (p.propertyType && d.propertyType !== p.propertyType) return false;
  if (p.minPrice != null && d.price < p.minPrice) return false;
  if (p.maxPrice != null && d.price > p.maxPrice) return false;
  if (p.minSurface != null && (d.surfaceM2 || 0) < p.minSurface) return false;
  if (p.minRooms != null && (d.rooms || 0) < p.minRooms) return false;
  if (p.city && (d.city || '').toLowerCase() !== String(p.city).toLowerCase()) return false;
  if (p.query && !(d.titleLower || '').includes(String(p.query).toLowerCase())) return false;
  return true;
}

function pick(id, d, distanceM) {
  return {
    id,
    ownerId: d.ownerId,
    title: d.title,
    propertyType: d.propertyType,
    transaction: d.transaction,
    price: d.price,
    currency: d.currency || 'TND',
    surfaceM2: d.surfaceM2 ?? null,
    rooms: d.rooms ?? null,
    city: d.city ?? null,
    lat: d.lat,
    lng: d.lng,
    coverUrl: d.coverUrl ?? null,
    createdAt: d.createdAt ? d.createdAt.toMillis() : null,
    distanceM: distanceM ?? null,
  };
}

exports.searchListings = onCall(async (req) => {
  const p = req.data || {};
  const limit = Math.min(p.limit || 20, 50);
  const sort = p.sort || 'recent';

  let base = db.collection('listings').where('status', '==', 'active');
  if (p.transaction) base = base.where('transaction', '==', p.transaction);

  // Mode géographique
  if (typeof p.lat === 'number' && typeof p.lng === 'number') {
    const center = [p.lat, p.lng];
    const radiusM = p.radiusM || 5000;
    const snaps = await Promise.all(
      geohashQueryBounds(center, radiusM).map((b) =>
        base.orderBy('geohash').startAt(b[0]).endAt(b[1]).limit(300).get()
      )
    );
    const seen = new Set();
    const found = [];
    for (const snap of snaps) {
      for (const doc of snap.docs) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const d = doc.data();
        const dist = distanceBetween([d.lat, d.lng], center) * 1000;
        if (dist <= radiusM && matches(d, p)) found.push(pick(doc.id, d, dist));
      }
    }
    const sorters = {
      distance: (a, b) => a.distanceM - b.distanceM,
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      recent: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    };
    found.sort(sorters[sort] || sorters.distance);
    const offset = p.offset || 0;
    return { items: found.slice(offset, offset + limit), total: found.length };
  }

  // Mode flux (sans position)
  const field = sort === 'recent' ? 'createdAt' : 'price';
  const dir = sort === 'price_asc' ? 'asc' : 'desc';
  let cursorDoc = p.cursor ? await db.doc(`listings/${p.cursor}`).get() : null;
  const items = [];
  let lastId = p.cursor || null;
  let exhausted = false;

  for (let i = 0; i < 4 && items.length < limit && !exhausted; i++) {
    let q = base.orderBy(field, dir);
    if (cursorDoc) q = q.startAfter(cursorDoc);
    const snap = await q.limit(50).get();
    for (const doc of snap.docs) {
      lastId = doc.id;
      const d = doc.data();
      if (matches(d, p)) items.push(pick(doc.id, d));
      if (items.length >= limit) break;
    }
    if (snap.size < 50) exhausted = true;
    cursorDoc = snap.docs[snap.docs.length - 1] || null;
  }
  const done = exhausted && items.length < limit;
  return { items, nextCursor: done ? null : lastId };
});

// 5. Nouveau message : mise à jour de la conversation + notification push
exports.onMessageCreated = onDocumentCreated('conversations/{cid}/messages/{mid}', async (event) => {
  const msg = event.data.data();
  const convRef = db.doc(`conversations/${event.params.cid}`);
  const conv = (await convRef.get()).data();
  if (!conv) return;

  const recipient = conv.participants.find((u) => u !== msg.senderId);
  if (!recipient) return;

  const preview = msg.content.length > 120 ? msg.content.slice(0, 117) + '…' : msg.content;
  await convRef.update({
    lastMessage: preview,
    lastMessageAt: msg.createdAt,
    lastSenderId: msg.senderId,
    [`unread.${recipient}`]: FieldValue.increment(1),
  });

  const [senderDoc, tokensSnap] = await Promise.all([
    db.doc(`users/${msg.senderId}`).get(),
    db.collection(`users/${recipient}/tokens`).get(),
  ]);
  if (tokensSnap.empty) return;

  const senderName = (senderDoc.data() && senderDoc.data().fullName) || 'Nouveau message';
  const res = await admin.messaging().sendEachForMulticast({
    tokens: tokensSnap.docs.map((t) => t.id),
    notification: { title: senderName, body: preview },
    data: { type: 'message', conversationId: event.params.cid, listingId: conv.listingId },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });

  const stale = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      stale.push(tokensSnap.docs[i].ref.delete());
    }
  });
  await Promise.all(stale);
});
