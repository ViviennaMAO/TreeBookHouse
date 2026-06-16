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

export function shortAddress(addr) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}
