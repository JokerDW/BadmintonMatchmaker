/**
 * 停用雙指縮放與雙擊放大。
 * viewport 的 user-scalable=no 在 iOS Safari 會被忽略，所以另外攔截手勢事件。
 */
export function disablePinchZoom() {
  // iOS Safari 專有的縮放手勢
  const stop = (e: Event) => e.preventDefault();
  document.addEventListener('gesturestart', stop, { passive: false });
  document.addEventListener('gesturechange', stop, { passive: false });
  document.addEventListener('gestureend', stop, { passive: false });
  // 其他瀏覽器：兩指以上的觸控移動
  document.addEventListener(
    'touchmove',
    e => { if (e.touches.length > 1) e.preventDefault(); },
    { passive: false },
  );
}
