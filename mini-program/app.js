// 不要在 app.js 里 import/require @luffalab/luffa-evm-sdk —
// 该 SDK 在某些老版本 Luffa 基础库 + 真机调试 runtime 下会让 Buffer polyfill 崩溃,
// 把 onLaunch 后续代码(包括 connect)整个中断,直接导致弹窗不出。
// 软登录只用原生 wx.invokeNativePlugin,纯净路径,不依赖任何 npm 包。
import { loadOwnership, saveOwnership } from './utils/ownership';
import { walletUserFromResponse } from './utils/luffa';

const WALLET_CACHE_KEY = 'tbh_wallet_cache';

App({
  globalData: {
    wallet: null,
    walletReady: false,
    language: 'zh-Hans',
    ownership: { bundle: false, books: {} }
  },

  _walletWaiters: [],

  onLaunch() {
    console.log('[TBH] onLaunch start');
    this.globalData.ownership = loadOwnership();
    this._warmCachedWallet();
    // 关键:把 connect 放到 onLaunch 同步代码末尾,确保前面任何崩溃都不影响它
    this._softConnect();
    this._fetchLanguage();
    console.log('[TBH] onLaunch end (softConnect dispatched)');
  },

  /** 用本地缓存先点亮 UI,避免空窗期。不触发任何网络/桥调用。*/
  _warmCachedWallet() {
    try {
      const raw = wx.getStorageSync(WALLET_CACHE_KEY);
      if (!raw) return;
      const cached = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (cached && cached.address) {
        this.globalData.wallet = cached;
      }
    } catch (e) {
      console.log('[TBH] warm cache skipped:', e && e.message);
    }
  },

  /**
   * 软登录:每次 onLaunch 都向 Luffa 钱包发起 connect。
   * 直接用 wx.invokeNativePlugin,不经 Promise wrapper、不经 EVM SDK,最大化兼容性。
   */
  _softConnect() {
    if (typeof wx === 'undefined' || !wx.invokeNativePlugin) {
      console.log('[TBH] wx.invokeNativePlugin unavailable — outside Luffa runtime?');
      this._finishWalletReady(null);
      return;
    }

    const uuid = 'tbh-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    console.log('[TBH] dispatching luffa connect, uuid=', uuid);

    // 参数结构对齐 @luffalab/luffa-evm-sdk 1.0.8 的 sendMiniProgramMessage 实现
    // ——用 EVM 风格的 initData 让 Luffa 钱包知道要弹 EVM/BSC 授权,而不是 Endless 流程。
    wx.invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: {
        methodName: 'connect',
        func: 'connect',
        chainType: 'evm',
        uuid: uuid,
        data: {},
        initData: {
          callbackWalletName: 'evmWallet',
          network: 'bsc'
        },
        metadata: {
          title: 'TreeBookHouse · 互动金融书房',
          desc: '读取你的 Luffa 钱包地址与昵称,用于解锁互动书'
        }
      },
      success: (res) => {
        const user = walletUserFromResponse(res);
        const addr = (user && (user.address || user.account)) || null;
        console.log('[TBH] connect success:', addr || JSON.stringify(res));
        if (addr) {
          const wallet = {
            address: addr,
            nickname: (user && user.nickname) || '',
            avatar: (user && user.avatar) || '',
            uid: (user && user.uid) || '',
            cid: (user && user.cid) || ''
          };
          this.globalData.wallet = wallet;
          try { wx.setStorageSync(WALLET_CACHE_KEY, JSON.stringify(wallet)); } catch (e) {}
          const own = this.globalData.ownership || loadOwnership();
          own.address = addr;
          saveOwnership(own);
          this.globalData.ownership = own;
          this._finishWalletReady(wallet);
        } else {
          // 弹窗触发了但用户没批 / 返回为空 — 不再重试
          this._finishWalletReady(null);
        }
      },
      fail: (err) => {
        console.log('[TBH] connect fail:', err);
        this._finishWalletReady(null);
      }
    });
  },

  _finishWalletReady(wallet) {
    this.globalData.walletReady = true;
    const waiters = this._walletWaiters;
    this._walletWaiters = [];
    waiters.forEach(fn => {
      try { fn(wallet); } catch (e) {}
    });
  },

  /** 页面可以 await app.whenWalletReady() 等软登录尘埃落定再渲染。*/
  whenWalletReady() {
    if (this.globalData.walletReady) {
      return Promise.resolve(this.globalData.wallet);
    }
    return new Promise(resolve => {
      this._walletWaiters.push(resolve);
    });
  },

  /** 让"重新授权"按钮可以手动再发起 connect。*/
  manualReconnect() {
    this.globalData.walletReady = false;
    this._softConnect();
    return this.whenWalletReady();
  },

  _fetchLanguage() {
    if (typeof wx === 'undefined' || !wx.invokeNativePlugin) return;
    wx.invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: { methodName: 'language' },
      success: (res) => {
        if (res && res.result) this.globalData.language = res.result;
      },
      fail: () => {}
    });
  },

  onShow() {
    console.log('[TBH] onShow');
  },

  onError(err) {
    console.error('[TBH App.onError]', err);
  }
});
