import { luffa } from './luffa';

const SUPERBOX_SCHEME = 'tcmppn3u4by5l18';

export async function openMiniProgram(appId, page = 'pages/index/index', query = '') {
  if (!appId) throw new Error('appId 缺失');
  const url = `${SUPERBOX_SCHEME}://?appId=${appId}&page=${page}&query=${encodeURIComponent(query)}`;
  return luffa('navigateToMiniProgram', { url });
}

export async function shareBook(book) {
  return luffa('share', {
    title: `《${book.title}》—— TreeBookHouse`,
    detail: book.pitch || book.desc,
    imageUrl: '',
    params: { bookId: book.id }
  });
}
