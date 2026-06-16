import { BOOKS } from '../../utils/books';
import { canOpen, loadOwnership } from '../../utils/ownership';

const app = getApp();

Page({
  data: {
    books: [],
    ownedSummary: '',
    walletReady: false,
    walletConnected: false,
    reconnecting: false
  },

  onLoad() {
    this.refresh();
    // 等软登录尘埃落定再刷一次 — 让"未授权"横幅及时显示/隐藏
    if (app.whenWalletReady) {
      app.whenWalletReady().then(() => this.refresh());
    }
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = loadOwnership();
    app.globalData.ownership = state;

    const wallet = (app.globalData && app.globalData.wallet) || null;
    const walletReady = !!(app.globalData && app.globalData.walletReady);

    const decorated = BOOKS.map(b => ({
      ...b,
      ownedView: canOpen(state, b) && b.price > 0
    }));

    let summary;
    if (state.bundle) {
      summary = '终身套餐 已激活';
    } else {
      const paidOwned = Object.keys(state.books).length;
      summary = paidOwned > 0 ? `${paidOwned} 本已解锁` : '尚未解锁付费内容';
    }

    this.setData({
      books: decorated,
      ownedSummary: summary,
      walletReady: walletReady,
      walletConnected: !!(wallet && wallet.address)
    });
  },

  async onReconnect() {
    if (this.data.reconnecting) return;
    this.setData({ reconnecting: true });
    try {
      if (app.manualReconnect) {
        await app.manualReconnect();
      }
    } catch (e) {}
    this.refresh();
    this.setData({ reconnecting: false });
  },

  goBundle() {
    wx.navigateTo({ url: '/pages/bundle/bundle' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});
