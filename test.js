function findIframeContainingPlayer() {
  const iframes = Array.from(document.querySelectorAll('iframe'));
  const targetOrigin = '*'; // ⚠️可指定来源，如 'https://xxx.com'

  return new Promise((resolve) => {
    const total = iframes.length;
    const results = new Array(total).fill(false);
    let settled = false;
    let responded = 0;

    function onMessage(event) {
      // 1. 可加 origin 安全校验（可选）
      if (event.origin !== 'https://expected-iframe-origin.com') return;

      const idx = iframes.findIndex(f => f.contentWindow === event.source);
      if (idx < 0 || results[idx] !== false) return; // 已响应或未知源

      const data = event.data;
      if (data && data.type === 'player-check-response') {
        responded++;
        results[idx] = data.hasPlayer;

        if (data.hasPlayer && !settled) {
          settled = true;
          window.removeEventListener('message', onMessage);
          resolve(iframes[idx]); // 找到了
        }

        if (responded === total && !settled) {
          settled = true;
          window.removeEventListener('message', onMessage);
          resolve(null); // 全部回复了，但没找到
        }
      }
    }

    window.addEventListener('message', onMessage);

    // 向所有 iframe 发消息请求
    for (const iframe of iframes) {
      iframe.contentWindow.postMessage({ type: 'check-player' }, targetOrigin);
    }
  });
}

// 用法示例
findIframeContainingPlayer().then((iframe) => {
  if (iframe) {
    console.log('Found iframe with #player:', iframe);
  } else {
    console.log('No iframe contains #player');
  }
});
