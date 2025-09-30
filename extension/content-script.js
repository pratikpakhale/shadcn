(function() {
  const isInIframe = window.self !== window.top;
  
  if (isInIframe) {
    function sendUrlToParent() {
      try {
        const currentUrl = window.location.href;
        window.parent.postMessage({
          type: 'SHADCN_HUB_IFRAME_URL_UPDATE',
          url: currentUrl,
          title: document.title,
          timestamp: Date.now()
        }, '*');
      } catch (error) {
        console.error('[Shadcn Hub Extension] Error:', error);
      }
    }
    
    sendUrlToParent();
    
    let lastUrl = window.location.href;
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(this, arguments);
      sendUrlToParent();
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      sendUrlToParent();
    };
    
    window.addEventListener('popstate', function() {
      sendUrlToParent();
    });
    
    window.addEventListener('hashchange', function() {
      sendUrlToParent();
    });
    
    setInterval(function() {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        sendUrlToParent();
      }
    }, 500);
    
    document.addEventListener('click', function() {
      setTimeout(sendUrlToParent, 100);
    }, true);
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', sendUrlToParent);
    }
  }
})();
