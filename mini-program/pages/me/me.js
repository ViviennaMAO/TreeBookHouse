import { BOOKS, findBook } from '../../utils/books';
import { canOpen, loadOwnership } from '../../utils/ownership';
import { connectWallet, PRICING } from '../../utils/payment';
import { luffa, shortAddress } from '../../utils/luffa';

const app = getApp();

/** Luffa 头像可能是 base64 字符串、http URL,或 { cid, hash } 对象。统一为可渲染的 URL。*/
function normalizeAvatar(av) {
  if (!av) return '';
  if (typeof av !== 'string') return ''; // IPFS 对象暂不渲染
  if (av.startsWith('data:') || av.startsWith('http')) return av;
  return 'data:image/jpeg;base64,' + av;
}

Page({
  data: {
    address: null,
    addressShort: '',
    nickname: '',
    avatar: '',
    bundleOn: false,
    ownedNum: 0,
    totalNum: BOOKS.length,
    shelf: [],
    history: [],
    receiverShort: '',
    connecting: false
  },

  onLoad() {
    this.setData({ receiverShort: shortAddress(PRICING.RECEIVER) });
    this.refresh();
    // 软登录可能还在跑;等它有结果再刷一次
    if (app.whenWalletReady) {
      app.whenWalletReady().then(() => this.refresh());
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = loadOwnership();
    const wallet = (app.globalData && app.globalData.wallet) || null;

    // 优先用软登录的身份;退化时用 ownership 里残存的地址
    const address = (wallet && wallet.address) || state.address || null;
    const nickname = (wallet && wallet.nickname) || '';
    const avatar = normalizeAvatar(wallet && wallet.avatar);

    const shelf = BOOKS.map(b => {
      let statusTag;
      if (b.price === 0) statusTag = 'free';
      else if (state.bundle) statusTag = 'bundle';
      else if (state.books[b.id]) statusTag = 'owned';
      else statusTag = 'locked';
      return { ...b, statusTag };
    });

    const ownedNum = state.bundle
      ? BOOKS.length
      : BOOKS.filter(b => canOpen(state, b)).length;

    const history = (state.history || [])
      .slice()
      .reverse()
      .map(h => {
        const isBundle = h.type === 'bundle';
        const book = isBundle ? null : findBook(h.bookId);
        return {
          ...h,
          bookTitle: book ? book.title : '',
          amount: isBundle ? PRICING.BUNDLE : (book ? book.price : ''),
          hashShort: h.txHash ? (h.txHash.slice(0, 10) + '…') : '—',
          timeText: formatTime(h.at)
        };
      });

    this.setData({
      address,
      addressShort: address ? shortAddress(address) : '',
      nickname,
      avatar,
      bundleOn: !!state.bundle,
      ownedNum,
      shelf,
      history
    });
  },

  /** 手动连接 —— 软登录失败 / 用户拒绝过才会用到。*/
  async connect() {
    this.setData({ connecting: true });
    try {
      const addr = await connectWallet();
      if (addr) {
        const state = loadOwnership();
        state.address = addr;
        wx.setStorageSync('tbh_ownership_v1', JSON.stringify(state));
        // 同步到全局 wallet,避免下次 refresh 又回到 null
        if (!app.globalData.wallet) {
          app.globalData.wallet = { address: addr, nickname: '', avatar: '', uid: '', cid: '' };
        } else {
          app.globalData.wallet.address = addr;
        }
        this.refresh();
      }
    } catch (err) {
      wx.showToast({ title: '连接已取消', icon: 'none' });
    } finally {
      this.setData({ connecting: false });
    }
  },

  goBundle() {
    wx.navigateTo({ url: '/pages/bundle/bundle' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  copyReceiver() {
    wx.setClipboardData({
      data: PRICING.RECEIVER,
      success: () => wx.showToast({ title: '地址已复制', icon: 'none' })
    });
  },

  async contactAuthor() {
    try {
      await luffa('openUrl', { url: 'https://callup.luffa.im/u/ViviennaMAO' });
    } catch (e) {
      wx.showToast({ title: '请稍后再试', icon: 'none' });
    }
  }
});

function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
