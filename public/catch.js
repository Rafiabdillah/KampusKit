window.addEventListener('error', function(e) {
  try {
    var msg = e.error ? e.error.message : e.message;
    var stack = e.error ? e.error.stack : '';
    if (!msg) return;
    if (msg.indexOf('websocket') !== -1 || msg.indexOf('vite-hmr') !== -1) return;
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, stack: stack, url: window.location.href, timestamp: Date.now() })
    }).catch(function() {});
  } catch (err) {}
});
