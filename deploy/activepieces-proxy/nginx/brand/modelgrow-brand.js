(() => {
  const BRAND = 'ModelGrow';
  const LOGO_URL = '/_modelgrow/logo.png';
  const BLOCKED_LABELS = new Set([
    'explore',
    'impact',
    'leaderboard',
    'community',
    'templates',
    'platform admin',
    'add members',
    'import',
  ]);

  const replaceBrandText = (value) => {
    if (!value || typeof value !== 'string') return value;
    return value
      .replace(/\bActivepieces\b/g, BRAND)
      .replace(/\bACTIVEPIECES\b/g, BRAND.toUpperCase());
  };

  const normalize = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

  const relabelAttributes = (root) => {
    const attrs = ['aria-label', 'alt', 'title', 'placeholder'];
    const nodes = root.querySelectorAll?.('*') || [];
    nodes.forEach((node) => {
      attrs.forEach((attr) => {
        const current = node.getAttribute?.(attr);
        const next = replaceBrandText(current);
        if (next && next !== current) node.setAttribute(attr, next);
      });
    });
  };

  const relabelTextNodes = (root) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const pending = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const next = replaceBrandText(node.nodeValue);
      if (next !== node.nodeValue) pending.push([node, next]);
    }
    pending.forEach(([node, next]) => {
      node.nodeValue = next;
    });
  };

  const isLikelyProductChrome = (node) => Boolean(
    node.closest?.('header, aside, nav, [role="banner"], [role="navigation"], [class*="sidebar" i], [class*="topbar" i]')
  );

  const getChromeRoots = () => {
    return Array.from(document.querySelectorAll(
      'header, aside, nav, [role="banner"], [role="navigation"], [class*="sidebar" i], [class*="topbar" i]'
    ));
  };

  const swapLogoImages = (root) => {
    const images = root.querySelectorAll?.('img') || [];
    images.forEach((img) => {
      if (!isLikelyProductChrome(img)) return;

      const haystack = [
        img.getAttribute('alt'),
        img.getAttribute('title'),
        img.getAttribute('aria-label'),
        img.className,
      ].join(' ');

      // Piece/node icons are often served from Activepieces asset paths too, so
      // src/srcset must not be used as branding evidence. Only explicit shell
      // logo labels are safe to replace.
      const looksLikeBrand = /\bactivepieces\b/i.test(haystack) || /\b(activepieces|modelgrow)\s+logo\b/i.test(haystack);
      if (!looksLikeBrand) return;
      img.src = LOGO_URL;
      img.removeAttribute('srcset');
      img.alt = BRAND;
      img.title = BRAND;
      img.style.objectFit = 'contain';
    });
  };

  const hideUnwantedProductLinks = (root) => {
    const candidates = root.querySelectorAll?.('a, button, [role="menuitem"], [role="tab"]') || [];
    candidates.forEach((element) => {
      const label = normalize(element.innerText || element.textContent || element.getAttribute('aria-label'));
      if (!BLOCKED_LABELS.has(label)) return;
      const navItem = element.closest('li, a, button, [role="menuitem"], [role="tab"], [data-sidebar-item], [class*="sidebar" i] > div');
      (navItem || element).style.display = 'none';
    });
  };

  const hideBuilderShellNoise = (root) => {
    const sidebars = root.querySelectorAll?.('aside, nav, [role="navigation"], [class*="sidebar" i]') || [];
    sidebars.forEach((sidebar) => {
      const items = sidebar.querySelectorAll('a, button, div, li, span, p');
      items.forEach((item) => {
        const label = normalize(item.innerText || item.textContent || item.getAttribute?.('aria-label'));
        const shouldHide =
          BLOCKED_LABELS.has(label) ||
          label === 'projects' ||
          label === 'personal project' ||
          /^modelgrow runtime\b/.test(label);
        if (!shouldHide) return;
        const container = item.closest('a, button, li, [role="menuitem"], [data-sidebar-item], [class*="item" i]') || item;
        container.style.display = 'none';
      });
    });
  };

  const removeActivepiecesBadges = (root) => {
    const candidates = root.querySelectorAll?.('a, span, p, button, [role="menuitem"], [role="tab"]') || [];
    candidates.forEach((element) => {
      const childElementCount = element.children?.length || 0;
      const text = element.textContent || '';

      // Never assign textContent on layout/container nodes. Doing that destroys
      // the React subtree and turns the builder into one giant raw text blob.
      // Text-node replacement is already handled safely by relabelTextNodes().
      if (childElementCount > 0 || text.length > 120 || !/\bActivepieces\b/i.test(text)) return;

      element.textContent = replaceBrandText(text);
    });
  };

  const swapInlineBrandMarks = (root) => {
    const chrome = root.querySelectorAll?.('header, aside, nav, [role="banner"], [role="navigation"], [class*="sidebar" i]') || [];
    chrome.forEach((container) => {
      const brandText = Array.from(container.querySelectorAll('a, button, div, span, p')).find((element) => {
        const label = normalize(element.textContent || element.getAttribute?.('aria-label'));
        return label === normalize(BRAND);
      });
      if (!brandText) return;

      const row = brandText.closest('a, button, div, header, [class*="brand" i], [class*="logo" i]') || brandText.parentElement;
      const svg = row?.querySelector?.('svg');
      if (!row || !svg || row.querySelector('[data-modelgrow-inline-logo="true"]')) return;

      const logo = document.createElement('img');
      logo.src = LOGO_URL;
      logo.alt = BRAND;
      logo.title = BRAND;
      logo.setAttribute('data-modelgrow-inline-logo', 'true');
      logo.style.width = '28px';
      logo.style.height = '28px';
      logo.style.objectFit = 'contain';
      logo.style.flexShrink = '0';
      svg.insertAdjacentElement('beforebegin', logo);
      svg.style.display = 'none';
    });
  };

  const applyBranding = () => {
    document.title = replaceBrandText(document.title || BRAND) || BRAND;
    const chromeRoots = getChromeRoots();
    chromeRoots.forEach((root) => {
      relabelAttributes(root);
      relabelTextNodes(root);
      swapLogoImages(root);
      removeActivepiecesBadges(root);
    });
    swapInlineBrandMarks(document);
    hideUnwantedProductLinks(document);
    hideBuilderShellNoise(document);
  };

  const unregisterOldServiceWorkers = () => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => registrations.forEach((registration) => registration.unregister()))
      .catch(() => {});
  };

  const installHeadBranding = () => {
    let icon = document.querySelector('link[rel~="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = '/favicon.ico';

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = LOGO_URL;

    const style = document.createElement('style');
    style.setAttribute('data-modelgrow-branding', 'true');
    style.textContent = `
      [href*="activepieces.com" i],
      [aria-label="Explore"],
      [aria-label="Impact"],
      [aria-label="Leaderboard"],
      [aria-label="Community"],
      [aria-label="Import"],
      [aria-label="Add Members"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  };

  const schedule = (() => {
    let pending = false;
    let lastRunAt = 0;
    return () => {
      if (pending) return;
      pending = true;
      const delay = Math.max(0, 250 - (Date.now() - lastRunAt));
      window.setTimeout(() => {
        pending = false;
        lastRunAt = Date.now();
        applyBranding();
      }, delay);
    };
  })();

  installHeadBranding();
  unregisterOldServiceWorkers();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBranding, { once: true });
  } else {
    applyBranding();
  }

  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['alt', 'title', 'aria-label', 'placeholder', 'src', 'srcset'],
  });
})();
