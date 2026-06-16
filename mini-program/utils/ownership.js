const KEY = 'tbh_ownership_v1';

function defaultState() {
  return {
    bundle: false,
    books: {},
    address: null,
    history: []
  };
}

export function loadOwnership() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (!raw) return defaultState();
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

export function saveOwnership(state) {
  try {
    wx.setStorageSync(KEY, JSON.stringify(state));
  } catch (e) {}
}

export function unlockBundle(state, { txHash, address }) {
  state.bundle = true;
  state.address = address || state.address;
  state.history.push({ type: 'bundle', txHash, at: Date.now() });
  saveOwnership(state);
  return state;
}

export function unlockBook(state, bookId, { txHash, address }) {
  state.books[bookId] = { txHash, paidAt: Date.now() };
  state.address = address || state.address;
  state.history.push({ type: 'book', bookId, txHash, at: Date.now() });
  saveOwnership(state);
  return state;
}

export function canOpen(state, book) {
  if (!book) return false;
  if (book.price === 0) return true;
  if (state.bundle) return true;
  return !!state.books[book.id];
}

export function ownedCount(state) {
  let n = 0;
  if (state.bundle) return Object.keys(state.books).length + 999;
  for (const k in state.books) if (state.books[k]) n++;
  return n;
}
