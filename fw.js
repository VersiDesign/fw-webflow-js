document.addEventListener('DOMContentLoaded', function () {
  // --- CORE VARIABLES ------------------------------------------------------
  var overlay         = document.querySelector('.sheets-overlay');
  var homeGutter      = document.querySelector('.home-gutter');
  var logo            = document.querySelector('.logo');
  var coreContent     = document.querySelector('.sheet-inner.content-core');
  var coreStripSlider = document.querySelector('.core-strip-slider');
  var linksWrap       = document.querySelector('.links__wrap');
  var brandBackBtn    = document.querySelector('.corebrand-back');
  var faceWrap        = document.querySelector('.face__wrap');

  // Single brand slide-in panel (homepage)
  var brandSheet      = document.querySelector('.brandsheet');

  // Age gate (homepage + brand pages)
  var ageGate         = document.querySelector('.age-gate');

  // =======================================================================
  // PERF: rAF-throttled layout updater (prevents resize spam)
  // =======================================================================
  var _layoutRaf = null;
  function requestLayoutUpdate() {
    if (_layoutRaf) return;
    _layoutRaf = requestAnimationFrame(function () {
      _layoutRaf = null;
      try { updateMobileNavMode(); } catch (e) {}
      try { applyLayout(); } catch (e) {}
    });
  }

  // =======================================================================
  // NAV TOGGLE SETUP  ✅ MUST RUN ON ALL PAGES
  // =======================================================================
  (function setupNavToggle() {
    const toggle    = document.querySelector('.nav__toggle');
    const navWrap   = document.querySelector('.nav__wrap');
    const toggleSVG = document.querySelector('.nav__toggle-svg');

    if (!toggle || !navWrap || !toggleSVG) return;

    // Prevent double-binding if the script is injected twice for any reason
    if (toggle.dataset.navBound === '1') return;
    toggle.dataset.navBound = '1';

    toggle._isOpen = false;

    function openNav() {
      navWrap.style.transform = 'translateX(-500px)';
      toggle.classList.add('nav__toggle--open');
      toggleSVG.style.color = 'black';
      toggle._isOpen = true;
    }

    function closeNav() {
      navWrap.style.transform = 'translateX(0)';
      toggle.classList.remove('nav__toggle--open');
      toggleSVG.style.color = 'black';
      toggle._isOpen = false;
    }

    toggle.addEventListener('click', () => {
      if (!toggle._isOpen) openNav();
      else closeNav();
    });

    window.closeMobileNavIfOpen = function () {
      if (toggle._isOpen) closeNav();
    };
  })();

  // =======================================================================
  // TRADE PORTAL REGISTER (Webflow IX proxy click) ✅ MUST RUN ON ALL PAGES
  // =======================================================================
  (function setupRegisterIXProxy() {

    function findExistingRegisterIXTrigger() {
      var explicit = document.querySelector('[data-register-trigger="1"]');
      if (explicit) return explicit;

      var byHref = document.querySelector('a[href="#register"], a[href*="#register"]');
      if (byHref) return byHref;

      var byClass = document.querySelector('.register-trigger, .trade-portal-login, .trade-portal-link');
      if (byClass) return byClass;

      return null;
    }

    function triggerRegisterInteraction() {
      var reg = document.querySelector('.register');
      if (!reg) return;

      var ixTrigger = findExistingRegisterIXTrigger();
      if (ixTrigger) {
        ixTrigger.click();
        return;
      }

      console.warn('[register] No IX trigger found. Add data-register-trigger="1" to the working element that opens .register.');
    }

    document.addEventListener('click', function (e) {
      var t1 = e.target && e.target.closest ? e.target.closest('#trade-portal') : null;
      var t2 = e.target && e.target.closest ? e.target.closest('#btn-trade-portal') : null;
      if (!t1 && !t2) return;

      e.preventDefault();

      if (typeof window.closeMobileNavIfOpen === 'function') {
        window.closeMobileNavIfOpen();
      }

      triggerRegisterInteraction();
    }, { passive: false });

  })();

  setupCustomDropdowns();

  // If neither overlay nor ageGate exists, nothing else to do
  if (!overlay && !ageGate) return;

  // --- PAGE MODE (trade-portal) -------------------------------------------
  var isTradePortalPage =
    (window.location && window.location.pathname && window.location.pathname.indexOf('trade-portal') !== -1) ||
    (document.body && document.body.className && document.body.className.indexOf('trade-portal') !== -1) ||
    (document.body && (document.body.classList.contains('trade-portal') || document.body.classList.contains('page-trade-portal')));

  // --- AGE GATE ------------------------------------------------------------
  (function setupAgeGate() {
    var gate = document.querySelector('.age-gate');
    if (!gate) return;

    var KEY = 'ageGateAccepted';
    try {
      if (window.sessionStorage && sessionStorage.getItem(KEY) === '1') {
        gate.remove();
        return;
      }
    } catch (e) {}

    gate.style.willChange = 'transform';
    gate.style.transform = 'translate3d(100%, 0, 0)';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        gate.style.transform = 'translate3d(0, 0, 0)';
      });
    });

    var yesBtn = gate.querySelector('.btn.btn-yes');
    var noBtn  = gate.querySelector('.btn.btn-no');
    if (!yesBtn) return;

    yesBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (window.sessionStorage) sessionStorage.setItem(KEY, '1');
      } catch (err) {}

      gate.style.transform = 'translate3d(100%, 0, 0)';

      var removed = false;
      function removeGate() {
        if (removed) return;
        removed = true;
        try { gate.remove(); } catch (err) {
          if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
        }
      }

      var onEnd = function (evt) {
        if (!evt || evt.propertyName === 'transform') {
          gate.removeEventListener('transitionend', onEnd);
          removeGate();
        }
      };

      gate.addEventListener('transitionend', onEnd);
      setTimeout(removeGate, 700);
    }, { passive: false });

    if (noBtn) {
      noBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        gate.style.transition = 'transform 170ms cubic-bezier(0.2, 0.8, 0.3, 1)';
        gate.style.transform  = 'translate3d(40px, 0, 0)';

        setTimeout(function () {
          gate.style.transition = 'transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1)';
          gate.style.transform  = 'translate3d(0, 0, 0)';
        }, 120);
      }, { passive: false });
    }
  })();

  // =======================================================================
  // MOBILE/TABLET MENU LINKS (Core/Sust/About)
  // =======================================================================
  (function setupHomeSheetRedirectLinks() {
    var navLinkCore  = document.querySelector('.nav__link-wrap.core');
    var navLinkSust  = document.querySelector('.nav__link-wrap.sustainability');
    var navLinkAbout = document.querySelector('.nav__link-wrap.about');

    if (!navLinkCore && !navLinkSust && !navLinkAbout) return;

    var HOME_PATH = '/';
    var KEY = 'openHomeSheetIndex';

    function isHomePage() {
      var p = window.location.pathname || '';
      return (p === HOME_PATH || p === '');
    }

    function requestOpenSheet(index) {
      try {
        if (window.sessionStorage) sessionStorage.setItem(KEY, String(index));
      } catch (e) {}

      if (!isHomePage()) {
        window.location.href = HOME_PATH;
        return;
      }

      try {
        window.dispatchEvent(new CustomEvent('homeSheetRequest', { detail: { index: index } }));
      } catch (e) {}
    }

    function bind(el, index) {
      if (!el) return;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        requestOpenSheet(index);

        if (typeof window.closeMobileNavIfOpen === 'function') {
          window.closeMobileNavIfOpen();
        }
      }, { passive: false });
    }

    bind(navLinkCore, 0);
    bind(navLinkSust, 1);
    bind(navLinkAbout, 2);
  })();

  // ------------------------------------------------------------------------
  // Custom dropdown + persistent visual scrollbar
  // ------------------------------------------------------------------------
  function setupCustomDropdowns() {
    var scrollbarInstances = [];
    var scrollbarByDropdown = new WeakMap();
    var resizeObserver = null;

    function getDropdowns() {
      return Array.from(document.querySelectorAll('.dropdown'));
    }

    function closeAll(exceptEl) {
      getDropdowns().forEach(function (dd) {
        if (exceptEl && dd === exceptEl) return;

        var inst = scrollbarByDropdown.get(dd);
        if (inst && inst.list) {
          try { inst.list.scrollTop = 0; } catch (e) {}
          updateScrollbar(inst);
        }

        dd.classList.remove('is-open');
        dd.setAttribute('aria-expanded', 'false');
      });
    }

    function updateScrollbar(instance) {
      if (!instance || !instance.list || !instance.rail || !instance.thumb) return;
      var list = instance.list;
      var rail = instance.rail;
      var thumb = instance.thumb;

      var clientH = list.clientHeight;
      var scrollH = list.scrollHeight;
      var maxScroll = Math.max(0, scrollH - clientH);

      if (clientH <= 0) {
        rail.style.opacity = '0';
        return;
      }

      rail.style.opacity = '1';

      var trackH = rail.clientHeight || clientH;
      var minThumbH = 36;
      var thumbH = (maxScroll <= 0)
        ? trackH
        : Math.max(minThumbH, Math.round(trackH * (clientH / scrollH)));
      var maxTop = Math.max(0, trackH - thumbH);
      var top = maxScroll ? Math.round((list.scrollTop / maxScroll) * maxTop) : 0;

      thumb.style.height = thumbH + 'px';
      thumb.style.transform = 'translateY(' + top + 'px)';
    }

    function refreshAllScrollbars() {
      scrollbarInstances.forEach(updateScrollbar);
    }

    function teardownDropdownBindings() {
      scrollbarInstances.forEach(function (instance) {
        if (instance && instance.list && instance.onScroll) {
          instance.list.removeEventListener('scroll', instance.onScroll);
        }
        if (resizeObserver && instance) {
          try { if (instance.list) resizeObserver.unobserve(instance.list); } catch (e) {}
          try { if (instance.rail) resizeObserver.unobserve(instance.rail); } catch (e) {}
        }
      });

      scrollbarInstances = [];
      scrollbarByDropdown = new WeakMap();

      getDropdowns().forEach(function (dropdown) {
        if (dropdown && dropdown.removeAttribute) {
          dropdown.removeAttribute('data-dropdown-bound');
        }

        var panel = dropdown && dropdown.querySelector ? dropdown.querySelector('.dropdown-panel') : null;
        if (!panel) return;

        Array.from(panel.querySelectorAll('.dropdown-scrollbar-rail')).forEach(function (rail) {
          if (rail && rail.parentNode) rail.parentNode.removeChild(rail);
        });
      });
    }

    function rebindDropdowns() {
      teardownDropdownBindings();
      getDropdowns().forEach(function (dropdown) {
        dropdown.classList.remove('is-open');
        dropdown.setAttribute('aria-expanded', 'false');
        wireDropdown(dropdown);
      });
      refreshAllScrollbars();
    }

    function wireDropdown(dropdown) {
      if (!dropdown || dropdown.dataset.dropdownBound === '1') return;

      var panel = dropdown.querySelector('.dropdown-panel');
      var list = dropdown.querySelector('.dropdown-list__collection');
      if (!panel) return;

      dropdown.setAttribute('aria-expanded', dropdown.classList.contains('is-open') ? 'true' : 'false');
      dropdown.dataset.dropdownBound = '1';

      panel.addEventListener('click', function (e) {
        e.stopPropagation();
      });

      if (list && !scrollbarByDropdown.has(dropdown)) {
        var rail = document.createElement('div');
        rail.className = 'dropdown-scrollbar-rail';
        rail.setAttribute('aria-hidden', 'true');

        var thumb = document.createElement('div');
        thumb.className = 'dropdown-scrollbar-thumb';
        rail.appendChild(thumb);
        panel.appendChild(rail);

        var instance = { list: list, rail: rail, thumb: thumb, onScroll: null };
        scrollbarInstances.push(instance);
        scrollbarByDropdown.set(dropdown, instance);

        instance.onScroll = function () {
          updateScrollbar(instance);
        };
        list.addEventListener('scroll', instance.onScroll, { passive: true });

        if (resizeObserver) {
          try { resizeObserver.observe(list); } catch (e) {}
          try { resizeObserver.observe(rail); } catch (e) {}
        }
      }
    }

    getDropdowns().forEach(wireDropdown);

    document.addEventListener('click', function (e) {
      var t = e.target;
      var toggle = (t && t.closest) ? t.closest('.dropdown-trigger, .triangle-svg') : null;

      if (toggle) {
        var dropdown = toggle.closest ? toggle.closest('.dropdown') : null;
        if (!dropdown) return;

        wireDropdown(dropdown);

        e.preventDefault();
        e.stopPropagation();

        var willOpen = !dropdown.classList.contains('is-open');
        closeAll(dropdown);
        dropdown.classList.toggle('is-open', willOpen);
        dropdown.setAttribute('aria-expanded', willOpen ? 'true' : 'false');

        if (willOpen) {
          var openInst = scrollbarByDropdown.get(dropdown);
          if (openInst && openInst.list) {
            try { openInst.list.scrollTop = 0; } catch (e) {}
            updateScrollbar(openInst);
          }
          setTimeout(refreshAllScrollbars, 0);
          setTimeout(refreshAllScrollbars, 120);
        } else {
          var closedInst = scrollbarByDropdown.get(dropdown);
          if (closedInst && closedInst.list) {
            try { closedInst.list.scrollTop = 0; } catch (e) {}
            updateScrollbar(closedInst);
          }
        }
        return;
      }

      closeAll();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.key || '').toLowerCase() === 'escape') closeAll();
    });

    // Prevent BFCache/history restore from leaving a dropdown visually open.
    window.addEventListener('pagehide', function () {
      closeAll();
    });

    window.addEventListener('pageshow', function (e) {
      var navEntry = null;
      try {
        navEntry = performance.getEntriesByType('navigation')[0] || null;
      } catch (err) {}

      var isBackForward = !!(e && e.persisted) || !!(navEntry && navEntry.type === 'back_forward');
      if (isBackForward) rebindDropdowns();
    });

    window.addEventListener('resize', refreshAllScrollbars);

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(refreshAllScrollbars);
      scrollbarInstances.forEach(function (instance) {
        resizeObserver.observe(instance.list);
        resizeObserver.observe(instance.rail);
      });
    }

    if ('MutationObserver' in window) {
      var mo = new MutationObserver(function () {
        getDropdowns().forEach(wireDropdown);
        refreshAllScrollbars();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    refreshAllScrollbars();
  }

  // ------------------------------------------------------------------------
  // Everything below is overlay/sheets code.
  // ------------------------------------------------------------------------
  if (!overlay) return;

  // --- HISTORY / TITLE -----------------------------------------------------
  var homeTitle = document.title;
  var isHandlingPop = false;

  try {
    history.replaceState({ brandPanel: false }, '', window.location.href);
  } catch (e) {}

  // --- TRADE PORTAL: force "face" Webflow Lottie to end frame + fade in ----
  function prepFaceLottieFade() {
    if (!isTradePortalPage) return;
    var el = document.querySelector('.face-lottie');
    if (!el) return;
    el.classList.add('is-trade-lottie-hide');
    el.classList.remove('is-trade-lottie-ready');
  }

  function revealFaceLottieFade() {
    if (!isTradePortalPage) return;
    var el = document.querySelector('.face-lottie');
    if (!el) return;
    el.classList.remove('is-trade-lottie-hide');
    el.classList.add('is-trade-lottie-ready');
  }

  function forceFaceLottieToEndFrame() {
    if (!isTradePortalPage) return;
    if (!window.Webflow || !Webflow.require) return;

    var wfLottie = Webflow.require('lottie');
    if (!wfLottie || !wfLottie.lottie || !wfLottie.lottie.getRegisteredAnimations) return;

    var anims = wfLottie.lottie.getRegisteredAnimations() || [];
    if (!anims.length) return;

    var didSet = false;

    anims.forEach(function (anim) {
      var wrapper = anim.wrapper;

      if (!wrapper && anim.renderer && anim.renderer.svgElement) {
        wrapper = anim.renderer.svgElement.closest('.w-lottie');
      }

      var isTarget =
        (wrapper && wrapper.classList && wrapper.classList.contains('face-lottie')) ||
        (wrapper && wrapper.querySelector && wrapper.querySelector('.face-lottie'));

      if (isTarget) {
        try {
          anim.stop();
          anim.goToAndStop(anim.totalFrames, true);
          didSet = true;
        } catch (e) {}
      }
    });

    if (didSet) requestAnimationFrame(revealFaceLottieFade);
  }

  prepFaceLottieFade();

  if (window.Webflow && Array.isArray(window.Webflow)) {
    window.Webflow.push(function () {
      requestAnimationFrame(forceFaceLottieToEndFrame);
      setTimeout(forceFaceLottieToEndFrame, 50);
      setTimeout(forceFaceLottieToEndFrame, 150);
      setTimeout(forceFaceLottieToEndFrame, 500);
    });
  } else {
    setTimeout(forceFaceLottieToEndFrame, 300);
  }

  // --- SHEET GROUPS --------------------------------------------------------
  var allSheets = Array.from(document.querySelectorAll('.sheet'));
  var sheets = allSheets;
  if (!sheets.length) return;

  var strips = sheets.map(sheet => sheet.querySelector('.sheet-strip'));

  // Scroll containers – include .brandsheet + injected .corebrand-inner
  var scrollContainers = Array.from(document.querySelectorAll('.sheet-inner, .corebrand-inner'));
  if (brandSheet) scrollContainers.push(brandSheet);

  var coreGridTiles = coreContent ? Array.from(coreContent.querySelectorAll('.core__grid-img')) : [];

  if (linksWrap) linksWrap.classList.add('is-preload');

  var activeIndex = null;
  var isInitialised = false;
  var coreIsOpen = false;

  // Single brand panel state
  var brandPanelOpen = false;
  var currentBrandURL = null;

  // =======================================================================
  // PERF: pause/resume the cursor rAF loop based on visibility/state
  // =======================================================================
  var _cursorRaf = null;

  // ✅ IMPORTANT: ensure this exists BEFORE applyLayout ever runs
  var animateCursor = null;

  function shouldRunCursorLoop() {
    return !!(coreIsOpen && !brandPanelOpen && document.visibilityState === 'visible');
  }

  function startCursorLoopIfNeeded() {
    if (_cursorRaf) return;                 // already running
    if (!shouldRunCursorLoop()) return;
    if (typeof animateCursor !== 'function') return; // ✅ prevent crash
    _cursorRaf = requestAnimationFrame(animateCursor);
  }

  function stopCursorLoop() {
    if (!_cursorRaf) return;
    cancelAnimationFrame(_cursorRaf);
    _cursorRaf = null;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') stopCursorLoop();
    else startCursorLoopIfNeeded();
  });

  // --- TRADE PORTAL: cache original sheet BGs + enforce consistent transitions
  var tpSheetMeta = null;
  if (isTradePortalPage && sheets.length === 3) {
    tpSheetMeta = sheets.map(function (s) {
      var bg = '';
      try { bg = window.getComputedStyle(s).backgroundColor || ''; } catch (e) {}
      return { el: s, originalBg: bg };
    });

    sheets.forEach(function (s) {
      s.style.transition = 'left 0.4s ease, opacity 0.25s ease, background-color 0.25s ease';
      s.style.willChange = 'left, opacity, background-color';

      var lbl = s.querySelector('.sheet-strip-label');
      if (lbl) {
        lbl.style.transition = 'opacity 0.25s ease';
        lbl.style.willChange = 'opacity';
        lbl.style.opacity = '1';
      }
    });
  }

  function setStripLabelOpacity(sheetEl, value) {
    if (!sheetEl) return;
    var lbl = sheetEl.querySelector('.sheet-strip-label');
    if (!lbl) return;
    lbl.style.opacity = String(value);
  }

  function resetAllStripLabels() {
    if (!isTradePortalPage) return;
    sheets.forEach(function (s) { setStripLabelOpacity(s, 1); });
  }

  function isMobileNavMode() {
    if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) return true;

    const iPadProPortrait = window.matchMedia && window.matchMedia(
      'only screen and (min-device-width: 1024px) and (max-device-width: 1366px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 2)'
    ).matches;

    if (iPadProPortrait) return true;

    return false;
  }

  var mobileNavMode = isMobileNavMode();

  function updateMobileNavMode() {
    mobileNavMode = isMobileNavMode();
    strips.forEach(strip => {
      if (!strip) return;
      strip.style.pointerEvents = mobileNavMode ? 'none' : 'auto';
    });
  }

  function getClosedPositions(W) {
    if (mobileNavMode) return [W, W, W];

    var closedDefault = [W - 300, W - 150, W - 75];

    if (isTradePortalPage && sheets && sheets.length === 3) {
      var brandsIdx = sheets.findIndex(s => s && s.classList && s.classList.contains('brands'));
      if (brandsIdx < 0) brandsIdx = 0;

      var closedTP = new Array(3);
      closedTP[brandsIdx] = W - 225;

      var remainingIdx = [0, 1, 2].filter(i => i !== brandsIdx);
      closedTP[remainingIdx[0]] = W - 150;
      closedTP[remainingIdx[1]] = W - 75;

      return closedTP;
    }

    return closedDefault;
  }

  function restoreTradePortalOriginalBGs() {
    if (!tpSheetMeta) return;
    tpSheetMeta.forEach(function (m) {
      if (!m || !m.el) return;
      m.el.style.backgroundColor = m.originalBg || '';
      m.el.style.background = '';
    });
  }

  // --- BRAND SHEET LAYOUT --------------------------------------------------
  function applyBrandSheetLayout() {
    if (!brandSheet) return;

    var viewportW = window.innerWidth || document.documentElement.clientWidth;

    var isIpadPortraitLarge = window.matchMedia &&
      window.matchMedia(
        'only screen and (min-device-width: 1024px) and (max-device-width: 1366px) and (orientation: portrait) and (-webkit-min-device-pixel-ratio: 2)'
      ).matches;

    var isOpen = coreIsOpen && brandPanelOpen;

    if (mobileNavMode && !isIpadPortraitLarge) {
      brandSheet.style.left = isOpen ? '0px' : (viewportW + 'px');
    } else {
      brandSheet.style.left = isOpen ? '75px' : (viewportW + 'px');
    }

    if (brandBackBtn) {
      if (isOpen) brandBackBtn.classList.add('is-visible');
      else brandBackBtn.classList.remove('is-visible');
    }

    if (isOpen && typeof hideCursor === 'function') hideCursor();
  }

  function applyLayout() {
    var W = overlay.clientWidth;
    var closed = getClosedPositions(W);

    overlay.style.pointerEvents = (activeIndex === null) ? 'none' : 'auto';

    if (faceWrap) {
      var noSheetsOpen = (activeIndex === null && !brandPanelOpen);
      if (mobileNavMode && noSheetsOpen) faceWrap.style.zIndex = '1401';
      else faceWrap.style.zIndex = '';
    }

    if (activeIndex === null) {
      sheets.forEach((sheet, idx) => {
        sheet.style.left = (closed[idx] !== undefined ? closed[idx] : (W + 'px')) + 'px';
        sheet.style.opacity = '1';
        sheet.style.pointerEvents = 'auto';
      });

      if (isTradePortalPage) {
        restoreTradePortalOriginalBGs();
        resetAllStripLabels();
      }

      if (homeGutter) {
        homeGutter.classList.remove('is-visible');
        homeGutter.style.pointerEvents = 'none';
      }

      if (coreContent) coreContent.classList.remove('is-open');
      if (coreStripSlider) coreStripSlider.classList.remove('is-hidden');
      if (linksWrap) linksWrap.classList.remove('is-hidden');

    } else {
      if (mobileNavMode) {
        sheets.forEach((sheet, idx) => {
          sheet.style.left = (idx === activeIndex) ? '0px' : (W + 'px');
        });
      } else {
        if (isTradePortalPage) {
          sheets.forEach((sheet, idx) => {
            if (idx === activeIndex) {
              sheet.style.left = '75px';
              sheet.style.opacity = '1';
              sheet.style.pointerEvents = 'auto';
              setStripLabelOpacity(sheet, 0);
            } else {
              sheet.style.opacity = '0';
              sheet.style.pointerEvents = 'none';
              setStripLabelOpacity(sheet, 1);
            }
          });
        } else {
          if (activeIndex === 0) {
            sheets[0].style.left = '0px';
            if (sheets[1]) sheets[1].style.left = closed[1] + 'px';
            if (sheets[2]) sheets[2].style.left = closed[2] + 'px';
          }
          if (activeIndex === 1) {
            if (sheets[0]) sheets[0].style.left = '0px';
            sheets[1].style.left = '150px';
            if (sheets[2]) sheets[2].style.left = closed[2] + 'px';
          }
          if (activeIndex === 2) {
            if (sheets[0]) sheets[0].style.left = '0px';
            if (sheets[1]) sheets[1].style.left = '150px';
            sheets[2].style.left = '225px';
          }
        }
      }

      if (homeGutter) {
        homeGutter.classList.add('is-visible');
        homeGutter.style.pointerEvents = 'auto';
      }

      if (coreContent) coreContent.classList.add('is-open');

      if (coreStripSlider) {
        if (activeIndex === 0) coreStripSlider.classList.add('is-hidden');
        else coreStripSlider.classList.remove('is-hidden');
      }

      if (linksWrap) linksWrap.classList.add('is-hidden');
    }

    sheets.forEach((sheet, idx) => {
      if (activeIndex !== null && idx === activeIndex) sheet.classList.add('is-active');
      else sheet.classList.remove('is-active');
    });

    coreIsOpen = (activeIndex === 0);

    applyBrandSheetLayout();

    // PERF: start/stop cursor loop depending on state
    if (shouldRunCursorLoop()) startCursorLoopIfNeeded();
    else stopCursorLoop();

    if (!isInitialised) {
      isInitialised = true;
      setTimeout(() => {
        overlay.classList.add('is-ready');
        if (linksWrap) requestAnimationFrame(() => linksWrap.classList.remove('is-preload'));
      }, 50);
    }

    updateMobileNavMode();
  }

  function resetLayerScrollDelayed() {
    if (!scrollContainers.length) return;
    setTimeout(() => {
      scrollContainers.forEach(el => {
        if (!el) return;
        var prev = el.style.scrollBehavior;
        el.style.scrollBehavior = 'auto';
        el.scrollTop = 0;
        el.style.scrollBehavior = prev;
      });
    }, 400);
  }

  function resetTradePortalSheetsToDefault() {
    if (!isTradePortalPage) return;

    activeIndex = null;

    if (brandPanelOpen) {
      closeBrandPanel({ push: false });
    } else {
      applyLayout();
    }

    resetLayerScrollDelayed();
  }

  // =======================================================================
  // WEBFLOW RE-INIT for dynamically injected content (Slider fix)
  // =======================================================================
  function webflowReinitInjectedContent(scopeEl) {
    if (!window.Webflow || !window.Webflow.require) return;

    try {
      var ix2 = Webflow.require('ix2');
      if (ix2 && ix2.init) ix2.init();
    } catch (e) {}

    try {
      var slider = Webflow.require('slider');
      if (slider && slider.ready) slider.ready();
      if (slider && slider.redraw) slider.redraw();
    } catch (e) {}

    try {
      var lightbox = Webflow.require('lightbox');
      if (lightbox && lightbox.ready) lightbox.ready();
    } catch (e) {}

    try {
      var tabs = Webflow.require('tabs');
      if (tabs && tabs.ready) tabs.ready();
    } catch (e) {}

    try {
      var dropdown = Webflow.require('dropdown');
      if (dropdown && dropdown.ready) dropdown.ready();
    } catch (e) {}
  }

  function webflowForceSliderRedrawSoon() {
    if (!window.Webflow || !window.Webflow.require) return;

    function doRedraw() {
      try {
        var slider = Webflow.require('slider');
        if (slider && slider.redraw) slider.redraw();
        if (slider && slider.ready) slider.ready();
      } catch (e) {}
    }

    requestAnimationFrame(doRedraw);
    setTimeout(doRedraw, 50);
    setTimeout(doRedraw, 180);
  }

  // =======================================================================
  // BRAND FETCH + INJECT + CACHE + IMAGE PRELOAD
  // =======================================================================
  function normaliseURL(href) {
    try { return new URL(href, window.location.origin).toString(); }
    catch (e) { return href; }
  }

  function getPathKey(url) {
    try {
      var u = new URL(url, window.location.origin);
      return u.pathname + u.search + u.hash;
    } catch (e) {
      return url;
    }
  }

  function getBrandMount() {
    if (!brandSheet) return null;

    var mount = brandSheet.querySelector('.brandsheet__content');
    if (!mount) mount = brandSheet.querySelector('.corebrand-inner');

    if (!mount) {
      mount = document.createElement('div');
      mount.className = 'corebrand-inner';
      brandSheet.appendChild(mount);
    }
    return mount;
  }

  function setBrandLoading(isLoading) {
    if (!brandSheet) return;
    if (isLoading) brandSheet.classList.add('is-loading');
    else brandSheet.classList.remove('is-loading');
  }

  // --- IMAGE PRELOAD HELPERS -----------------------------------------------
  var IMG_PRELOAD_CONCURRENCY = 4;
  var _imgActive = 0;
  var _imgQueue = [];

  function queueImagePreload(url) {
    if (!url) return Promise.resolve();
    return new Promise(function (resolve) {
      _imgQueue.push({ url: url, resolve: resolve });
      pumpImageQueue();
    });
  }

  function pumpImageQueue() {
    while (_imgActive < IMG_PRELOAD_CONCURRENCY && _imgQueue.length) {
      var job = _imgQueue.shift();
      _imgActive++;

      var img = new Image();
      img.onload = img.onerror = function () {
        _imgActive--;
        job.resolve();
        pumpImageQueue();
      };
      img.src = job.url;
    }
  }

  function toAbsUrl(raw) {
    if (!raw) return null;
    raw = String(raw).trim();
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return null;
    raw = raw.replace(/^['"]|['"]$/g, '');
    try { return new URL(raw, window.location.origin).toString(); }
    catch (e) { return null; }
  }

  function pickFromSrcset(srcset) {
    if (!srcset) return null;
    var parts = String(srcset).split(',');
    if (!parts.length) return null;
    var last = parts[parts.length - 1].trim();
    var url = last.split(/\s+/)[0];
    return url ? toAbsUrl(url) : null;
  }

  function extractImageUrlsFromElement(el) {
    if (!el) return [];
    var urls = [];

    el.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || img.getAttribute('data-src');
      var srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');

      var best = pickFromSrcset(srcset) || toAbsUrl(src);
      if (best) urls.push(best);

      var absSrc = toAbsUrl(src);
      if (absSrc) urls.push(absSrc);
    });

    el.querySelectorAll('source').forEach(function (s) {
      var srcset = s.getAttribute('srcset') || s.getAttribute('data-srcset');
      var best = pickFromSrcset(srcset);
      if (best) urls.push(best);
    });

    el.querySelectorAll('[style]').forEach(function (node) {
      var style = node.getAttribute('style');
      if (!style) return;
      var re = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
      var m;
      while ((m = re.exec(style)) !== null) {
        var abs = toAbsUrl(m[2]);
        if (abs) urls.push(abs);
      }
    });

    return Array.from(new Set(urls));
  }

  function preloadImageList(urls) {
    if (!Array.isArray(urls) || !urls.length) return Promise.resolve();
    return Promise.all(urls.map(queueImagePreload)).then(function () {});
  }

  // --- BRAND CACHE ---------------------------------------------------------
  var brandCache = new Map();
  var brandFetches = new Map();

  async function fetchBrandHTML(url) {
    var key = getPathKey(url);

    if (brandCache.has(key)) return brandCache.get(key);
    if (brandFetches.has(key)) return brandFetches.get(key);

    var p = (async function () {
      var res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Fetch failed: ' + res.status);

      var finalURL = res.url || url;
      var html = await res.text();

      var doc = new DOMParser().parseFromString(html, 'text/html');
      var innerEl = doc.querySelector('.corebrand-inner');
      if (!innerEl) throw new Error('No .corebrand-inner found on ' + url);

      var title = null;
      var t = doc.querySelector('title');
      if (t && t.textContent) title = t.textContent.trim();

      var imageUrls = extractImageUrlsFromElement(innerEl);

      var payload = {
        finalURL: finalURL,
        title: title,
        innerHTML: innerEl.innerHTML,
        imageUrls: imageUrls
      };

      brandCache.set(key, payload);
      preloadImageList(imageUrls).catch(function () {});
      return payload;
    })();

    brandFetches.set(key, p);

    try {
      return await p;
    } finally {
      brandFetches.delete(key);
    }
  }

  async function fetchAndInjectBrand(url) {
    if (!brandSheet) {
      window.location.href = url;
      return { url: url, title: null };
    }

    setBrandLoading(true);

    var payload = await fetchBrandHTML(url);

    var mount = getBrandMount();
    if (!mount) throw new Error('No brand mount available');

    mount.innerHTML = payload.innerHTML;

    webflowReinitInjectedContent(mount);
    webflowForceSliderRedrawSoon();

    try { mount.scrollTop = 0; } catch (e) {}

    if (payload.title) document.title = payload.title;

    setBrandLoading(false);

    return { url: payload.finalURL || url, title: payload.title };
  }

  async function openBrandFromURL(url, opts) {
    opts = opts || {};
    var push = (opts.push !== false);

    if (activeIndex !== 0) activeIndex = 0;

    var result = await fetchAndInjectBrand(url);

    brandPanelOpen = true;
    currentBrandURL = result.url || url;
    applyLayout();

    if (brandSheet) {
      var done = false;
      var onEnd = function (evt) {
        if (done) return;
        if (!evt || evt.propertyName === 'left') {
          done = true;
          try { brandSheet.removeEventListener('transitionend', onEnd); } catch (e) {}
          webflowForceSliderRedrawSoon();
        }
      };
      brandSheet.addEventListener('transitionend', onEnd);

      setTimeout(function () {
        if (done) return;
        done = true;
        try { brandSheet.removeEventListener('transitionend', onEnd); } catch (e) {}
        webflowForceSliderRedrawSoon();
      }, 700);
    }

    if (push && !isHandlingPop) {
      try {
        var u = new URL(currentBrandURL, window.location.origin);
        history.pushState(
          { brandPanel: true, url: (u.pathname + u.search + u.hash) },
          '',
          (u.pathname + u.search + u.hash)
        );
      } catch (e) {}
    }
  }

  function closeBrandPanel(opts) {
    opts = opts || {};
    var push = (opts.push !== false);

    if (!brandPanelOpen) return;

    brandPanelOpen = false;
    currentBrandURL = null;

    document.title = homeTitle;

    applyLayout();
    resetLayerScrollDelayed();

    var mount = getBrandMount();
    if (mount) {
      var cleared = false;
      function clearNow() {
        if (cleared) return;
        cleared = true;
        mount.innerHTML = '';
      }

      if (brandSheet) {
        var onEnd = function (evt) {
          if (!evt || evt.propertyName === 'left') {
            brandSheet.removeEventListener('transitionend', onEnd);
            clearNow();
          }
        };

        brandSheet.addEventListener('transitionend', onEnd);

        setTimeout(function () {
          try { brandSheet.removeEventListener('transitionend', onEnd); } catch (e) {}
          clearNow();
        }, 650);
      } else {
        clearNow();
      }
    }

    if (push && !isHandlingPop) {
      try {
        history.pushState({ brandPanel: false }, '', '/');
      } catch (e) {}
    }
  }

  // =======================================================================
  // ✅ TRADE PORTAL (desktop): brands strip click -> slide open + fade to white
  // then navigate using the Webflow link href after a delay.
  //
  // IMPORTANT: uses CAPTURE so it runs BEFORE the generic .sheet click handler.
  // Also avoids requestAnimationFrame (your earlier crash prevented execution).
  // =======================================================================
  (function setupTradePortalBrandsStripSlideFadeDelayLink() {
    if (!isTradePortalPage) return;
    if (!sheets || sheets.length !== 3) return;

    var DELAY_MS = 650; // tune 550–800ms
    var WHITE = '#fff';

    function isDesktopMode() {
      return !isMobileNavMode();
    }

    function getBrandsIndex() {
      var idx = sheets.findIndex(function (s) {
        return s && s.classList && s.classList.contains('brands');
      });
      return (idx < 0) ? 0 : idx;
    }

    function getBrandsSheet() {
      var idx = getBrandsIndex();
      return sheets[idx] || null;
    }

    function fadeBrandsToWhite(sheetEl) {
      if (!sheetEl) return;
      // You confirmed: .sheet.brands is yellow.
      sheetEl.style.setProperty('background-color', WHITE, 'important');
      sheetEl.style.setProperty('background', WHITE, 'important');
    }

    document.addEventListener('click', function (e) {
      if (!isDesktopMode()) return;

      // Preserve normal browser behaviours
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (typeof e.button === 'number' && e.button !== 0) return;

      var t = e.target;
      if (!t || !t.closest) return;

      // Only intercept clicks from the brands strip area
      var strip = t.closest('.sheet-strip.brands');
      if (!strip) return;

      // Find the real link Webflow will navigate to
      var link = t.closest('a[href]') || strip.querySelector('a[href]');
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      var target = (link.getAttribute('target') || '').toLowerCase();
      if (target === '_blank') return;

      // Stop immediate navigation & any bubbling handlers (including .sheet click)
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      // 1) Slide open brands sheet (your existing system)
      try { closeBrandPanel({ push: true }); } catch (err) {}
      activeIndex = getBrandsIndex();
      applyLayout();

      // 2) Fade to white shortly after layout so the transition actually animates
      var brandsSheet = getBrandsSheet();
      setTimeout(function () {
        fadeBrandsToWhite(brandsSheet);
      }, 20);

      // Optional: prevent double-click spam
      try { strip.style.pointerEvents = 'none'; } catch (err) {}
      setTimeout(function () {
        try { strip.style.pointerEvents = ''; } catch (err) {}
      }, DELAY_MS + 50);

      // 3) Navigate after delay using Webflow link href
      setTimeout(function () {
        window.location.href = href;
      }, DELAY_MS);

    }, true); // CAPTURE
  })();

  // --- SHEET STRIP CLICK ---------------------------------------------------
  sheets.forEach((sheet, idx) => {
    if (!sheet) return;

    sheet.addEventListener('click', e => {
      e.stopPropagation();
      if (mobileNavMode) return;
      if (activeIndex === idx) return;

      closeBrandPanel({ push: true });

      activeIndex = idx;
      applyLayout();
      resetLayerScrollDelayed();
    });
  });

  // --- HOME GUTTER / LOGO RESET -------------------------------------------
  if (homeGutter) {
    homeGutter.addEventListener('click', () => {
      closeBrandPanel({ push: true });
      activeIndex = null;
      applyLayout();
      resetLayerScrollDelayed();
    });
  }

  if (logo) {
    logo.addEventListener('click', function () {
      closeBrandPanel({ push: true });
      activeIndex = null;
      applyLayout();
      resetLayerScrollDelayed();
    });
  }

  if (brandBackBtn) {
    brandBackBtn.addEventListener('click', e => {
      e.stopPropagation();
      closeBrandPanel({ push: true });
    });
  }

  // --- CORE GRID TILE CLICKS (UPDATED) ------------------------------------
  function getTileURL(tile) {
    var a = tile.closest('a') || tile.querySelector('a[href]') || (tile.tagName === 'A' ? tile : null);
    if (!a) return null;
    var href = a.getAttribute('href');
    if (!href) return null;
    return normaliseURL(href);
  }

  coreGridTiles.forEach((tile) => {
    tile.addEventListener('click', async (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var abs = getTileURL(tile);
      if (!abs) return;

      try {
        var u = new URL(abs, window.location.origin);
        if (u.origin !== window.location.origin) return;
      } catch (err) {}

      e.preventDefault();
      e.stopPropagation();

      try {
        await openBrandFromURL(abs, { push: true });
      } catch (err) {
        console.warn(err);
        window.location.href = abs;
      }
    });

    var url = getTileURL(tile);
    if (!url) return;

    tile.addEventListener('mouseenter', () => {
      fetchBrandHTML(url).catch(() => {});
    });

    tile.addEventListener('touchstart', () => {
      fetchBrandHTML(url).catch(() => {});
    }, { passive: true });
  });

  // --- NAV LINKS TO OPEN SHEETS (tablet/mobile only) -----------------------
  var navLinkCore  = document.querySelector('.nav__link-wrap.core');
  var navLinkSust  = document.querySelector('.nav__link-wrap.sustainability');
  var navLinkAbout = document.querySelector('.nav__link-wrap.about');

  function openSheetFromNav(index) {
    closeBrandPanel({ push: true });

    activeIndex = index;

    if (index === 0 && coreContent) {
      try { coreContent.scrollTop = 0; } catch (err) {}
    }

    applyLayout();
    resetLayerScrollDelayed();

    if (typeof window.closeMobileNavIfOpen === 'function') {
      window.closeMobileNavIfOpen();
    }
  }

  if (navLinkCore) {
    navLinkCore.addEventListener('click', e => {
      if (!isMobileNavMode()) return;
      e.preventDefault();
      openSheetFromNav(0);
    });
  }

  if (navLinkSust) {
    navLinkSust.addEventListener('click', e => {
      if (!isMobileNavMode()) return;
      e.preventDefault();
      openSheetFromNav(1);
    });
  }

  if (navLinkAbout) {
    navLinkAbout.addEventListener('click', e => {
      if (!isMobileNavMode()) return;
      e.preventDefault();
      openSheetFromNav(2);
    });
  }

  // =======================================================================
  // HOMEPAGE: consume pending "open sheet" requests (from other pages)
  // =======================================================================
  function consumePendingHomeSheetOpen() {
    var KEY = 'openHomeSheetIndex';
    var raw = null;

    try {
      if (window.sessionStorage) raw = sessionStorage.getItem(KEY);
    } catch (e) {}

    if (raw === null || raw === undefined) return;

    try { sessionStorage.removeItem(KEY); } catch (e) {}

    var idx = parseInt(raw, 10);
    if (isNaN(idx)) return;

    setTimeout(function () {
      try { openSheetFromNav(idx); } catch (e) {}
    }, 60);
  }

  window.addEventListener('homeSheetRequest', function (evt) {
    if (!evt || !evt.detail) return;
    var idx = parseInt(evt.detail.index, 10);
    if (isNaN(idx)) return;

    if (typeof window.closeMobileNavIfOpen === 'function') {
      window.closeMobileNavIfOpen();
    }

    setTimeout(function () {
      try { openSheetFromNav(idx); } catch (e) {}
    }, 30);
  });

  // --- POPSTATE: browser back/forward should open/close brand panel --------
  window.addEventListener('popstate', function (e) {
    isHandlingPop = true;

    try {
      var state = e.state || null;
      var path = window.location.pathname + window.location.search + window.location.hash;

      if (!state || state.brandPanel === false || window.location.pathname === '/') {
        if (brandPanelOpen) closeBrandPanel({ push: false });
        isHandlingPop = false;
        return;
      }

      if (state.brandPanel === true && state.url) {
        openBrandFromURL(state.url, { push: false }).finally(function () {
          isHandlingPop = false;
        });
        return;
      }

      if (window.location.pathname !== '/') {
        openBrandFromURL(path, { push: false }).finally(function () {
          isHandlingPop = false;
        });
        return;
      }
    } catch (err) {
      console.warn(err);
    }

    isHandlingPop = false;
  });

  // --- TRADE PORTAL: prevent BFCache restoring open sheet states ------------
  window.addEventListener('pagehide', function () {
    if (!isTradePortalPage) return;
    resetTradePortalSheetsToDefault();
  });

  window.addEventListener('pageshow', function (e) {
    if (!isTradePortalPage) return;

    var navEntry = null;
    try {
      navEntry = performance.getEntriesByType('navigation')[0] || null;
    } catch (err) {}

    var isBackForward = !!(e && e.persisted) || !!(navEntry && navEntry.type === 'back_forward');
    if (!isBackForward) return;

    resetTradePortalSheetsToDefault();
  });

  // --- PRELOAD ALL 16 CORE BRANDS (STAGGERED + CONCURRENCY) ----------------
  function preloadAllCoreBrands(options) {
    options = options || {};
    var concurrency = Math.max(1, options.concurrency || 3);
    var staggerMs   = Math.max(0, options.staggerMs || 120);

    var urls = coreGridTiles
      .map(getTileURL)
      .filter(Boolean);

    urls = Array.from(new Set(urls));
    if (!urls.length) return;

    var idx = 0;
    var active = 0;

    function pump() {
      while (active < concurrency && idx < urls.length) {
        (function (url, startDelay) {
          active++;
          setTimeout(function () {
            fetchBrandHTML(url)
              .catch(function () {})
              .finally(function () {
                active--;
                pump();
              });
          }, startDelay);
        })(urls[idx], staggerMs * idx);

        idx++;
      }
    }

    pump();
  }

  // --- INITIAL LAYOUT ------------------------------------------------------
  updateMobileNavMode();
  applyLayout();
  consumePendingHomeSheetOpen();

  window.addEventListener('resize', requestLayoutUpdate);
  window.addEventListener('orientationchange', requestLayoutUpdate);

  if ('requestIdleCallback' in window) {
    requestIdleCallback(function () {
      preloadAllCoreBrands({ concurrency: 3, staggerMs: 120 });
    }, { timeout: 2000 });
  } else {
    setTimeout(function () {
      preloadAllCoreBrands({ concurrency: 3, staggerMs: 120 });
    }, 900);
  }

  // --- CORE CURSOR SETUP (same UX; perf-gated loop)
  var coreCursorEnabled = coreContent && window.matchMedia('(pointer: fine)').matches;
  var rootElement = document.documentElement;

  var coreCursor = null;
  var coreCursorBg = null;
  var coreCursorLabel = null;

  var mouseX = 0, mouseY = 0;
  var posX = 0, posY = 0;
  var targetScale = 1;
  var currentScale = 1;
  var cursorIsVisible = false;

  function showCursor() {
    if (!coreCursorEnabled || !coreCursor || !coreIsOpen || brandPanelOpen) return;
    if (!cursorIsVisible) {
      cursorIsVisible = true;
      coreCursor.style.opacity = '1';
      rootElement.classList.add('core-hide-pointer');
    }
  }

  function hideCursor() {
    if (!coreCursorEnabled || !coreCursor) return;
    if (cursorIsVisible) {
      cursorIsVisible = false;
      coreCursor.style.opacity = '0';
      rootElement.classList.remove('core-hide-pointer');
    }
  }

  window.hideCursor = hideCursor;

  if (coreCursorEnabled) {
    coreCursor = document.createElement('div');
    coreCursor.className = 'core-cursor';

    coreCursorBg = document.createElement('div');
    coreCursorBg.className = 'core-cursor-bg';

    coreCursorLabel = document.createElement('span');
    coreCursorLabel.className = 'core-cursor-label';
    coreCursorLabel.textContent = 'View';

    coreCursor.appendChild(coreCursorBg);
    coreCursor.appendChild(coreCursorLabel);

    document.body.appendChild(coreCursor);

    coreContent.addEventListener('mouseenter', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      posX = mouseX;
      posY = mouseY;
      showCursor();
      startCursorLoopIfNeeded();
    });

    coreContent.addEventListener('mouseleave', function () {
      hideCursor();
      stopCursorLoop();
    });

    coreContent.addEventListener('mousemove', e => {
      if (!coreIsOpen || brandPanelOpen) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    coreGridTiles.forEach(tile => {
      const inner = tile.querySelector('.core__grid-img-inner');

      tile.addEventListener('mouseenter', () => {
        if (brandPanelOpen) return;
        targetScale = 3;
        coreCursor.classList.add('core-cursor--over-card');
        if (inner) inner.style.transform = 'scale(1.05)';
      });

      tile.addEventListener('mouseleave', () => {
        targetScale = 1;
        coreCursor.classList.remove('core-cursor--over-card');
        if (inner) inner.style.transform = '';
      });
    });

    // ✅ assign (do not declare) so it exists for earlier callers
    animateCursor = function () {
      if (!shouldRunCursorLoop()) {
        _cursorRaf = null;
        return;
      }

      posX += (mouseX - posX) * 0.18;
      posY += (mouseY - posY) * 0.18;

      currentScale += (targetScale - currentScale) * 0.18;

      if (coreCursor) {
        coreCursor.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate3d(-50%, -50%, 0)`;
      }

      if (coreCursorBg) {
        coreCursorBg.style.transform = `scale(${currentScale.toFixed(3)})`;
      }

      _cursorRaf = requestAnimationFrame(animateCursor);
    };

    if (shouldRunCursorLoop()) startCursorLoopIfNeeded();
  }

  // ========================================================================
  // About circle number count-up (unchanged)
  // ========================================================================
  (function setupAboutCountUpOnEachOpen() {
    const aboutSheet = document.querySelector('.sheet.about');
    const targets = Array.from(document.querySelectorAll('.about__circle-number'));
    if (!aboutSheet || !targets.length) return;

    let wasActive = false;
    const DURATION_MS = 2600;

    function parseNumberParts(text) {
      const raw = (text || '').trim();

      const prefixMatch = raw.match(/^[^\d\-.,]+/);
      const prefix = prefixMatch ? prefixMatch[0] : '';

      const suffixMatch = raw.match(/[^\d.,]+$/);
      const suffix = suffixMatch ? suffixMatch[0] : '';

      const core = raw.replace(prefix, '').replace(suffix, '').trim();
      const hasComma = core.includes(',');

      const dotIndex = core.lastIndexOf('.');
      const decimals = dotIndex >= 0 ? (core.length - dotIndex - 1) : 0;

      const num = parseFloat(core.replace(/,/g, ''));
      return {
        prefix,
        suffix,
        value: isNaN(num) ? 0 : num,
        decimals,
        hasComma
      };
    }

    function formatValue(v, parts) {
      const { decimals, hasComma } = parts;

      if (decimals > 0) {
        if (hasComma) {
          return v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
        }
        return v.toFixed(decimals);
      }

      const rounded = Math.round(v);
      return hasComma ? rounded.toLocaleString() : String(rounded);
    }

    function runAllSharedTimer() {
      const items = targets.map((el) => {
        if (!el.dataset.final) el.dataset.final = el.textContent.trim();
        const parts = parseNumberParts(el.dataset.final);

        el.textContent = `${parts.prefix}${formatValue(0, parts)}${parts.suffix}`;
        return { el, parts, end: parts.value };
      });

      const maxEnd = Math.max.apply(null, items.map(i => i.end));
      if (!isFinite(maxEnd) || maxEnd <= 0) return;

      const t0 = performance.now();

      function tick(now) {
        const t = Math.min(1, (now - t0) / DURATION_MS);
        const sharedValue = maxEnd * t;

        items.forEach(({ el, parts, end }) => {
          const current = Math.min(end, sharedValue);
          el.textContent = `${parts.prefix}${formatValue(current, parts)}${parts.suffix}`;
        });

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          items.forEach(({ el, parts, end }) => {
            el.textContent = `${parts.prefix}${formatValue(end, parts)}${parts.suffix}`;
          });
        }
      }

      requestAnimationFrame(tick);
    }

    const mo = new MutationObserver(() => {
      const isActive = aboutSheet.classList.contains('is-active');

      if (isActive && !wasActive) {
        runAllSharedTimer();
      }

      wasActive = isActive;
    });

    mo.observe(aboutSheet, { attributes: true, attributeFilter: ['class'] });
  })();

});
