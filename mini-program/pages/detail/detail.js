import { findBook } from '../../utils/books';
import { canOpen, loadOwnership, unlockBook } from '../../utils/ownership';
import { payUSDT } from '../../utils/payment';
import { openMiniProgram } from '../../utils/navigate';

const app = getApp();

Page({
  data: {
    book: null,
    canOpen: false,
    purchasing: false,
    opening: false,
    error: null,
    lastTx: null
  },

  onLoad(query) {
    const book = findBook(query.id);
    if (!book) {
      wx.showToast({ title: '书目不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
      return;
    }
    wx.setNavigationBarTitle({ title: book.title });
    this.setData({ book });
    this.refresh();
  },

  onShow() {
    if (this.data.book) this.refresh();
  },

  refresh() {
    const state = loadOwnership();
    this.setData({ canOpen: canOpen(state, this.data.book) });
  },

  async openBook() {
    this.setData({ opening: true, error: null });
    try {
      await openMiniProgram(this.data.book.appId);
    } catch (err) {
      this.setData({ error: (err && err.errMsg) || String(err) });
    } finally {
      this.setData({ opening: false });
    }
  },

  async purchaseBook() {
    const book = this.data.book;
    if (!book || book.price <= 0) return;

    this.setData({ purchasing: true, error: null, lastTx: null });
    try {
      const { hash, payer } = await payUSDT(book.price);
      const state = unlockBook(loadOwnership(), book.id, { txHash: hash, address: payer });
      app.globalData.ownership = state;
      this.setData({
        canOpen: true,
        lastTx: hash,
        purchasing: false
      });
      wx.showToast({ title: '解锁成功', icon: 'success' });
    } catch (err) {
      const msg = (err && (err.errMsg || err.message)) || String(err);
      this.setData({ purchasing: false, error: msg });
    }
  },

  goBundle() {
    wx.navigateTo({ url: '/pages/bundle/bundle' });
  }
});
