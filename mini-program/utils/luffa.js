export function luffa(methodName, data = {}) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || !wx.invokeNativePlugin) {
      reject(new Error('wx.invokeNativePlugin unavailable. Open inside Luffa Cloud-Devtools or a real Luffa client.'));
      return;
    }
    wx.invokeNativePlugin({
      api_name: 'luffaWebRequest',
      data: { methodName, ...data },
      success: resolve,
      fail: reject
    });
  });
}

export function sessionUuid() {
  return 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

export function walletUserFromResponse(res) {
  const candidates = [
    res,
    res && res.result,
    res && res.data,
    res && res.user,
    res && res.result && res.result.data,
    res && res.result && res.result.user
  ];

  for (let i = 0; i < candidates.length; i += 1) {
    const user = candidates[i];
    if (user && (user.address || user.account)) return user;
  }

  return null;
}

export function walletAddressFromResponse(res) {
  const user = walletUserFromResponse(res);
  return (user && (user.address || user.account)) || null;
}

export function shortAddress(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}
