// 不在文件顶部 import @luffalab/luffa-evm-sdk —— 改成函数内 lazy require + try/catch,
// 同时提供"直接走原生 wx.invokeNativePlugin"的回落路径。
// 这样即使 SDK 在某些 Luffa 基础库下加载失败,付款仍然能通过原生桥送签发交易。

const BSC_MAINNET = 56;
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955';
const RECEIVER = '0xc05ffc6067198d9bbc30ecf91356ffc4e0e12a53';

let _sdkCache = null;     // 缓存 SDK 实例(成功加载的情况)
let _sdkBroken = false;   // 标记 SDK 加载已失败,避免反复重试

function loadSdkSafe() {
  if (_sdkCache || _sdkBroken) return _sdkCache;
  try {
    const mod = require('@luffalab/luffa-evm-sdk');
    const SdkClass = mod && (mod.LuffaEvmSdk || mod.default);
    if (!SdkClass) {
      _sdkBroken = true;
      return null;
    }
    _sdkCache = new SdkClass({ network: 'bsc' });
    return _sdkCache;
  } catch (e) {
    console.log('[TBH payment] SDK load failed, will fall back to native bridge:', e && e.message);
    _sdkBroken = true;
    return null;
  }
}

/** 优先取 SDK 缓存的地址,其次取 app 软登录 globalData.wallet。*/
function getCachedAddress() {
  try {
    const mod = require('@luffalab/luffa-evm-sdk');
    const SdkClass = mod && (mod.LuffaEvmSdk || mod.default);
    if (SdkClass && typeof SdkClass.getAccountAddress === 'function') {
      const a = SdkClass.getAccountAddress();
      if (a) return a;
    }
  } catch (e) {}
  try {
    const app = getApp();
    return (app && app.globalData && app.globalData.wallet && app.globalData.wallet.address) || null;
  } catch (e) {
    return null;
  }
}

/** "9.9" -> "9900000000000000000" (× 10^18, BSC USDT 18 decimals) — 不用 BigInt。*/
function usdtToWeiDec(amount) {
  const [intPart, fracPart = ''] = String(amount).split('.');
  const padded = (fracPart + '000000000000000000').slice(0, 18);
  const out = (intPart + padded).replace(/^0+/, '');
  return out || '0';
}

/** 十进制字符串 -> 小写十六进制(无 0x 前缀)。*/
function decToHex(decStr) {
  let n = decStr;
  if (!n || n === '0') return '0';
  let hex = '';
  while (n !== '0' && n.length > 0) {
    let rem = 0;
    let next = '';
    for (let i = 0; i < n.length; i++) {
      const cur = rem * 10 + parseInt(n.charAt(i), 10);
      const q = Math.floor(cur / 16);
      rem = cur % 16;
      if (q > 0 || next.length > 0) next += String(q);
    }
    if (next === '') next = '0';
    hex = rem.toString(16) + hex;
    n = next;
  }
  return hex || '0';
}

/** ERC20/BEP20 transfer(address,uint256) calldata 编码。*/
function encodeTransfer(toAddress, amountHex) {
  const methodId = 'a9059cbb';
  const addr = toAddress.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amt = amountHex.padStart(64, '0');
  return '0x' + methodId + addr + amt;
}

/** 通过原生桥发起 connect(SDK 不可用时的回落)。EVM 风格 initData。*/
function nativeConnect() {
  return new Promise((resolve) => {
    if (typeof wx === 'undefined' || !wx.invokeNativePlugin) {
      resolve(null);
      return;
    }
    wx.invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: {
        methodName: 'connect',
        func: 'connect',
        chainType: 'evm',
        uuid: 'tbh-pay-' + Date.now(),
        data: {},
        initData: { callbackWalletName: 'evmWallet', network: 'bsc' },
        metadata: {
          title: 'TreeBookHouse · 解锁互动书',
          desc: '需要你的 Luffa 钱包授权以完成 USDT 支付'
        }
      },
      success: (res) => resolve((res && (res.address || res.account)) || null),
      fail: () => resolve(null)
    });
  });
}

/** 通过原生桥发起 signAndSubmitTransaction(SDK 不可用时的回落)。*/
function nativeSendTx(from, to, valueHex, data) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || !wx.invokeNativePlugin) {
      reject(new Error('wx.invokeNativePlugin 不可用'));
      return;
    }
    wx.invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: {
        methodName: 'signAndSubmitTransaction',
        func: 'signAndSubmitTransaction',
        chainType: 'evm',
        uuid: 'tbh-tx-' + Date.now(),
        initData: { callbackWalletName: 'evmWallet', network: 'bsc' },
        from: from,
        data: { from: from, to: to, value: valueHex, data: data },
        metadata: {
          title: 'TreeBookHouse · USDT 支付',
          desc: '签名并广播 BSC 上的 USDT 转账'
        }
      },
      success: (res) => {
        const hash = res && (res.hash || res.transactionHash);
        if (hash) resolve(hash);
        else reject(new Error((res && (res.message || res.errMsg)) || '签名被取消'));
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '钱包通讯失败'))
    });
  });
}

export async function connectWallet() {
  // 软登录命中就直接返回
  const cached = getCachedAddress();
  if (cached) return cached;

  // 尝试 SDK
  const sdk = loadSdkSafe();
  if (sdk) {
    try {
      const accounts = await sdk.connect();
      return Array.isArray(accounts) && accounts[0] ? accounts[0] : null;
    } catch (e) {
      console.log('[TBH payment] sdk.connect failed, fallback to native:', e && e.message);
    }
  }

  // 回落:原生桥
  return await nativeConnect();
}

export async function payUSDT(amount) {
  let address = getCachedAddress();
  if (!address) address = await connectWallet();
  if (!address) throw new Error('钱包未授权');

  const weiDec = usdtToWeiDec(amount);
  const weiHex = decToHex(weiDec);
  const data = encodeTransfer(RECEIVER, weiHex);

  // 优先 SDK
  const sdk = loadSdkSafe();
  if (sdk) {
    try {
      const hash = await sdk.sendTransaction({
        params: [{ from: address, to: USDT_BSC, value: '0x0', data: data }]
      });
      return { hash, payer: address, amount };
    } catch (e) {
      console.log('[TBH payment] sdk.sendTransaction failed, fallback to native:', e && e.message);
    }
  }

  // 回落:原生桥
  const hash = await nativeSendTx(address, USDT_BSC, '0x0', data);
  return { hash, payer: address, amount };
}

export const PRICING = {
  SINGLE: 9.9,
  BUNDLE: 19.9,
  ORIGINAL_BUNDLE: 39.6,
  RECEIVER,
  USDT_CONTRACT: USDT_BSC,
  NETWORK: 'bsc',
  CHAIN_ID: BSC_MAINNET,
  CHAIN_NAME: 'BNB Chain'
};
