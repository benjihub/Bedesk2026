(function (scriptSrc) {
  let iframe;

  // set to true when actual livechat app inside iframe is fully loaded
  let setIsBootstrapped;
  let isBootstrapped = new Promise(resolve => (setIsBootstrapped = resolve));

  // set to true when iframe is loaded
  let setIframeIsReady;
  let isIframeReady = new Promise(resolve => (setIframeIsReady = resolve));

  // time when iframe was loaded
  let loadedAt = performance.now();

  // callbacks to be called when livechat is destroyed
  let destroyCallbacks = [];

  window.BeChat = {
    onLoaded: callback => {
      isBootstrapped.then(() => callback());
    },
    showLauncher: async () => {
      await isIframeReady;
      iframe.style.display = 'block';
    },
    hideLauncher: async () => {
      await isIframeReady;
      iframe.style.display = 'none';
    },
    setTheme: async themeId => {
      await isBootstrapped;
      iframe.contentWindow.postMessage(
        {
          source: 'livechat-loader',
          type: 'setTheme',
          themeId,
        },
        '*',
      );
    },
    setUserData: async userData => {
      await isBootstrapped;
      iframe.contentWindow.postMessage(
        {
          source: 'livechat-loader',
          type: 'setUserData',
          userData,
        },
        '*',
      );
    },
    destroy: async () => {
      iframe?.remove();
      iframe = null;
      isBootstrapped = new Promise(resolve => (setIsBootstrapped = resolve));
      setIframeIsReady = new Promise(resolve => (setIframeIsReady = resolve));
      loadedAt = null;
      destroyCallbacks.forEach(callback => callback());
      destroyCallbacks = [];
    },
  };

  // navigation
  const notifyOfNavigation = function () {
    iframe.contentWindow.postMessage(
      {
        source: 'livechat-loader',
        type: 'navigate',
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        time: performance.now(),
        initialLoadTime: loadedAt,
      },
      '*',
    );
  };

  // unseen chats count in title
  function isCountInTitle() {
    return /^\(\d+\)\s/.test(document.title);
  }
  function addCountToTitle(number) {
    if (!isCountInTitle()) {
      const prefix = `(${number}) `;
      document.title = prefix + document.title;
    }
  }
  function removeCountFromTitle() {
    document.title = document.title.replace(/^\(\d+\)\s/, '');
  }

  // launcher and popup will have 16px padding to show shadow,
  // so we need to adjust user specified spacing, if it's more then 16px
  const setSpacing = function (widgetConfig) {
    const position = widgetConfig?.position ?? 'right';

    let bottom = widgetConfig?.spacing.bottom
      ? parseInt(widgetConfig.spacing.bottom)
      : 0;
    let side = widgetConfig?.spacing.side
      ? parseInt(widgetConfig.spacing.side)
      : 0;
    bottom = Math.max(bottom - 16, 0);
    side = Math.max(side - 16, 0);

    iframe.style.right = position === 'right' ? `${side}px` : '';
    iframe.style.left = position === 'left' ? `${side}px` : '';
    iframe.style.bottom = `${bottom}px`;
  };

  const executeLoader = () => {
    iframe = document.createElement('iframe');
    iframe.id = 'be-chat-iframe';

    let domain = window.BeChatSettings?.widgetDomain
      ? window.BeChatSettings?.widgetDomain
      : scriptSrc;

    if (!domain) {
      throw new Error('Could not resolve livechat domain');
    }

    const iframeUrl = new URL(domain);

    // include original pathname, in case bedesk is hosted on nested path e.g. site.com/bedesk
    let pathname = iframeUrl.pathname.replace('/livechat-loader.js', '');
    iframeUrl.pathname = `${pathname}/lc/widget`;

    if (window.BeChatSettings?.user) {
      iframeUrl.searchParams.set(
        'user',
        btoa(JSON.stringify(window.BeChatSettings.user)),
      );
    }

    if (window.BeChatSettings?.scopedHcCategoryId) {
      iframeUrl.searchParams.set(
        'scopedHcCategoryId',
        window.BeChatSettings.scopedHcCategoryId,
      );
    }

    if (window.BeChatSettings?.department) {
      iframeUrl.searchParams.set('department', window.BeChatSettings.department);
    }

    const pageSearch = new URL(document.location.toString()).searchParams;

    // Generate or read persistent visitor id so server can map the same
    // anonymous customer across reloads and third-party iframes.
    let visitorId = null;
    try {
      visitorId = localStorage.getItem('bechat:visitorId');
      if (!visitorId) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          visitorId = crypto.randomUUID();
        } else {
          // fallback simple uuid
          visitorId = 'v-' + Math.random().toString(36).slice(2) + Date.now();
        }
        localStorage.setItem('bechat:visitorId', visitorId);
      }
    } catch (e) {
      // ignore storage errors
    }
    if (visitorId) {
      iframeUrl.searchParams.set('visitorId', visitorId);
    }
    if (pageSearch.get('beConversationId')) {
      iframeUrl.searchParams.set(
        'conversationId',
        pageSearch.get('beConversationId'),
      );
    } else {
      // Fallback auto-resume from parent localStorage
      try {
        const lastId = localStorage.getItem('bechat:lastConversationId');
        if (lastId) {
          iframeUrl.searchParams.set('conversationId', lastId);
        }
      } catch (e) {
        // ignore storage errors
      }
    }

    // Ensure visitorId is present in final iframe src even if some
    // environments behave oddly with URL.searchParams.
    let finalSrc = iframeUrl.toString();
    if (visitorId && !finalSrc.includes('visitorId=')) {
      const sep = finalSrc.includes('?') ? '&' : '?';
      finalSrc = `${finalSrc}${sep}visitorId=${encodeURIComponent(visitorId)}`;
    }
    iframe.src = finalSrc;
    iframe.style =
      'display: block; position: fixed; bottom: 0; right: 0; border: none; overflow: hidden; width: 0;height: 0; max-height: calc(100dvh - 16px); z-index: 2147483639; outline: none; max-width: 100%;';
    document.body.appendChild(iframe);
    setIframeIsReady();

    const messageListener = e => {
      if (e.data.source !== 'livechat-widget') return;

      // resize
      if (e.data.type === 'resize') {
        if (e.data.shouldTransition) {
          iframe.style.transition = 'width 0.125s, height 0.125s';
        } else {
          iframe.style.transition = 'none';
        }
        iframe.style.width = e.data.width;
        iframe.style.height = e.data.height;
      }

      // unseen chats count
      if (e.data.type === 'unseenChats') {
        if (e.data.action === 'addCountToTitle') {
          addCountToTitle(e.data.count);
        } else {
          removeCountFromTitle();
        }
      }

      // bootstrap
      if (e.data.type === 'bootstrap') {
        setSpacing(e.data.widgetConfig);

        // Always show for debugging
        iframe.style.display = 'block';

        if (typeof window.BeChatReady === 'function') {
          window.BeChatReady(window.BeChat);
        }
        setIsBootstrapped();

        notifyOfNavigation();
      }

      // persist last active conversation id so widget can auto-resume after reloads
      if (e.data.type === 'activeConversationChanged') {
        try {
          const lastId = e.data.conversationId != null ? String(e.data.conversationId) : '';
          if (lastId) {
            localStorage.setItem('bechat:lastConversationId', lastId);
          } else {
            localStorage.removeItem('bechat:lastConversationId');
          }
        } catch (err) {
          // ignore storage errors
        }
      }
    };

    window.addEventListener('message', messageListener);
    destroyCallbacks.push(() => {
      window.removeEventListener('message', messageListener);
    });

    if (window.navigation) {
      const navigateListener = () => {
        setTimeout(() => {
          notifyOfNavigation();
        });
      };
      window.navigation.addEventListener('navigate', navigateListener);
      destroyCallbacks.push(() => {
        window.navigation.removeEventListener('navigate', navigateListener);
      });
    } else {
      const originalPushState = history.pushState;
      history.pushState = function (e) {
        originalPushState.apply(history, arguments);
        setTimeout(() => {
          notifyOfNavigation();
        });
      };
      destroyCallbacks.push(() => {
        history.pushState = originalPushState;
      });
    }

    loadedAt = performance.now();
  };

  if (document.readyState !== 'complete') {
    document.addEventListener('DOMContentLoaded', executeLoader);
  } else {
    executeLoader();
  }
})(document.currentScript.src);
