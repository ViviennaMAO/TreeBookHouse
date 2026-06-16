import { loadOwnership, unlockBundle } from '../../utils/ownership';
import { payUSDT, PRICING } from '../../utils/payment';
import { shortAddress } from '../../utils/luffa';

const app = getApp();

Page({
  data: {
    owned: false,
    purchasing: false,
    error: null,
    lastTx: null,
    receiverShort: ''
  },

  onLoad() {
    this.setData({ receiverShort: shortAddress(PRICING.RECEIVER) });
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const state = loadOwnership();
    this.setData({ owned: !!state.bundle });
  },

  async purchase() {
    this.setData({ purchasing: true, error: null, lastTx: null });
    try {
      const { hash, payer } = await payUSDT(PRICING.BUNDLE);
      const state = unlockBundle(loadOwnership(), { txHash: hash, address: payer });
      app.globalData.ownership = state;
      this.setData({
        owned: true,
        lastTx: hash,
        purchasing: false
      });
      wx.showToast({ title: '终身激活成功', icon: 'success' });
    } catch (err) {
      const msg = (err && (err.errMsg || err.message)) || String(err);
      this.setData({ purchasing: false, error: msg });
    }
  },

  goShelf() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
