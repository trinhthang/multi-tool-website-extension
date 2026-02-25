const titleTab = "MISA";
const normalTextColor = "#444444";
const normalBorderColor = "#999999";
const normalBackgroundColor = "#cccccc";

// ====== WHITELIST (Bỏ qua) ======
const WHITELIST_PATTERNS = [];

// ====== OVERLAY SELECTORS ======
const OVERLAY_SELECTORS = [
  'div[style*="position: fixed"][style*="width: 100"]',
  'div[style*="position: fixed"][style*="height: 100"]',
  'div[style*="position: absolute"][style*="width: 100"]',
  '[style*="z-index: 999"]',
  '[style*="z-index: 9999"]',
  '[style*="z-index: 99999"]',
  '[class*="overlay"]',
  '[class*="interstitial"]',
  '[class*="popup-overlay"]',
  '[class*="backdrop"]',
  '[class*="dimmer"]',
  '[class*="mask"]',
];

// ====== CLOSE BUTTON SELECTORS ======
const CLOSE_BUTTON_SELECTORS = [
  '[class*="close"]',
  '[class*="dismiss"]',
  '[class*="skip"]',
  '[aria-label*="close" i]',
  '[aria-label*="Close" i]',
  '[title*="close" i]',
  '[title*="Close" i]',
  'button[class*="close"]',
  'a[class*="close"]',
  ".fa-times",
  ".fa-close",
];

chrome.storage.sync.get(
  {
    blockSites: [],
    ignoreClasses: [],
    hideImages: true,
    hideImagesComplete: false,
    hideAds: true,
    hideAdsComplete: false,
    hideFavicon: false,
    normalizeColor: false,
    imageScale: 100,
    fontScale: 100,
  },
  (data) => {
    const blockSites = data.blockSites || [];
    const ignoreClasses = data.ignoreClasses || [];
    const hideImages = data.hideImages !== false;
    const hideImagesComplete = data.hideImagesComplete === true;
    const hideAds = data.hideAds !== false;
    const hideAdsComplete = data.hideAdsComplete === true;
    const hideFavicon = data.hideFavicon === true;
    const normalizeColor = data.normalizeColor === true;
    const imageScale = data.imageScale || 100;
    const fontScale = data.fontScale || 100;
    const domain = location.hostname.replace(/^www\./, "");

    // ====== HÀM KIỂM TRA BỎ QUA ======
    function shouldIgnore(el) {
      if (ignoreClasses.length > 0) {
        if (el.classList) {
          for (const cls of ignoreClasses) {
            if (el.classList.contains(cls)) return true;
          }
        }

        let parent = el.parentElement;
        while (parent) {
          if (parent.classList) {
            for (const cls of ignoreClasses) {
              if (parent.classList.contains(cls)) return true;
            }
          }
          parent = parent.parentElement;
        }
      }

      let className = "";
      if (typeof el.className === "string") {
        className = el.className.toLowerCase();
      } else if (el.className && el.className.baseVal) {
        className = el.className.baseVal.toLowerCase();
      }

      const id = (el.id || "").toLowerCase();

      for (const pattern of WHITELIST_PATTERNS) {
        if (className.includes(pattern) || id.includes(pattern)) {
          return true;
        }
      }

      return false;
    }

    // ====== INJECT CSS BLOCKER ======
    function injectBlockerCSS() {
      if (document.getElementById("ext-blocker-css")) return;

      const css = document.createElement("style");
      css.id = "ext-blocker-css";

      let rules = "";

      // Normalize color
      if (normalizeColor) {
        rules += `
          [data-color-normalized] {
            color: ${normalTextColor} !important;
          }
          [data-border-normalized] {
            border-color: ${normalBorderColor} !important;
          }
          [data-bg-color-processed] {
            background-color: ${normalBackgroundColor} !important;
          }
        `;
      }

      // Ẩn ảnh
      if (hideImages) {
        if (hideImagesComplete) {
          rules += `
            img[data-processed] {
              display: none !important;
            }
            [data-bg-processed] {
              display: none !important;
            }
          `;
        } else {
          rules += `
            img[data-processed] {
              background-color: ${normalBackgroundColor} !important;
              border: 1px dashed ${normalBorderColor} !important;
            }
            [data-bg-processed] {
              background-image: none !important;
              background-color: ${normalBackgroundColor} !important;
              border: 1px dashed ${normalBorderColor} !important;
            }
          `;
        }
      }

      // Ẩn quảng cáo
      if (hideAds) {
        if (hideAdsComplete) {
          rules += `
            [data-ad-processed] {
              display: none !important;
            }
          `;
        } else {
          rules += `
            [data-ad-processed] {
              background-color: ${normalBackgroundColor} !important;
              border: 1px dashed ${normalBorderColor} !important;
            }
          `;
        }
      }

      // Overlay
      rules += `
        [data-overlay-processed] {
          display: none !important;
        }
      `;

      // ====== IMAGE SCALE ======
      if (imageScale !== 100) {
        rules += `
          .page-chapter img,
          .chapter-content img,
          .reading-detail img,
          .comic-page img {
            width: ${imageScale}% !important;
            max-width: none !important;
            height: auto !important;
          }
          img:not([data-ad-processed]):not([data-processed]):not(.page-chapter img) {
            transform: scale( ${imageScale / 100}) !important;
            transform-origin: top left !important;
          }
        `;
      }

      // ====== FONT SCALE ======
      if (fontScale !== 100) {
        rules += `
          html {
            font-size: ${fontScale}% !important;
          }
        `;
      }

      css.textContent = rules;
      (document.head || document.documentElement).appendChild(css);
    }

    if (blockSites.some((site) => domain.endsWith(site))) {
      // ====== CẤU HÌNH SELECTOR QUẢNG CÁO/POPUP ======
      const AD_SELECTORS = [
        // HIGH CONFIDENCE
        "ins.adsbygoogle",
        '[id^="google_ads"]',
        '[id^="div-gpt-ad"]',
        "[data-google-query-id]",
        "[data-ad-slot]",
        'iframe[src*="doubleclick.net"]',
        'iframe[src*="googlesyndication.com"]',
        'iframe[src*="googleadservices.com"]',

        // SPECIFIC PATTERNS
        '[id^="_pop-qqgo-"]',
        '[id^="sp-wrapper-hovering"]',
        '[id^="_ad-banner-"]',
        '[id^="_pop-"]',
        '[id^="__clb-"]',

        // ID CHỨA KEYWORD
        '[id*="banner"]',
        '[id*="-ad-"]',
        '[id*="_ad_"]',

        // CLASS-BASED
        '[class^="ad-"]',
        '[class$="-ad"]',
        '[class^="ads-"]',
        '[class$="-ads"]',
        '[class^="advertisement"]',
        '[class^="banner-ad"]',
        '[class^="popup-ad"]',
        '[class*="ad-container"]',
        '[class*="ad_container"]',
        '[class*="adslot"]',
        '[class*="adsense"]',
        '[class*="ads-banner"]',

        // ID-BASED
        '[id^="ad-"]',
        '[id^="ads-"]',
        '[id^="adv-"]',
        '[id^="banner-"]',
        '[id^="popup-"]',
        '[id^="sponsor-"]',

        // COMBINED
        'div[class*="ad"][class*="wrapper"]',
        'div[class*="ad"][class*="container"]',
        'aside[class*="ad"]',
        'section[class*="sponsored"]',

        // STYLE-BASED
        'div[style*="position: fixed"][style*="z-index: 9999"]',
        'div[style*="position: fixed"][style*="z-index: 999999"]',

        // IFRAME ADS
        'iframe[id*="google_ads"]',
        'iframe[src*="/ad/"]',
        'iframe[src*="/ads/"]',
        'iframe[src*="adnxs.com"]',
        'iframe[src*="taboola.com"]',
        'iframe[src*="outbrain.com"]',
        "iframe:not([src])",
        'iframe[src=""]',

        // ATTRIBUTE-BASED
        "[data-ad]",
        "[data-ads]",
        "[data-ad-client]",
        "[data-cfasync]",
      ];

      const SCAN_INTERVAL = 3000;

      // ====== NORMALIZE COLOR ======
      let colorProcessing = false;

      function normalizeColors() {
        if (!normalizeColor || colorProcessing) return;
        colorProcessing = true;

        requestAnimationFrame(() => {
          document.querySelectorAll("*").forEach((el) => {
            if (shouldIgnore(el)) return;

            if (!el.hasAttribute("data-color-normalized")) {
              el.setAttribute("data-color-normalized", "true");

              const style = window.getComputedStyle(el);
              if (style.borderWidth && style.borderWidth !== "0px") {
                el.setAttribute("data-border-normalized", "true");
              }
            }
          });
          colorProcessing = false;
        });
      }

      // ====== ẨN FAVICON ======
      function setupFavicon() {
        if (!hideFavicon) return;

        let headObserver;
        let faviconProcessing = false;

        function removeFavicon() {
          if (faviconProcessing) return;
          faviconProcessing = true;

          if (headObserver) headObserver.disconnect();

          // Xóa favicon
          document.querySelectorAll('link[rel*="icon"]').forEach((link) => {
            if (!link.hasAttribute("data-blocked")) link.remove();
          });

          if (!document.querySelector('link[data-blocked="true"]')) {
            const emptyFavicon = document.createElement("link");
            emptyFavicon.rel = "icon";
            emptyFavicon.href = "data:,";
            emptyFavicon.setAttribute("data-blocked", "true");
            if (document.head) document.head.appendChild(emptyFavicon);
          }

          // Đổi title thành MISA
          document.title = titleTab;

          if (headObserver && document.head) {
            headObserver.observe(document.head, { childList: true });
          }

          faviconProcessing = false;
        }

        removeFavicon();

        headObserver = new MutationObserver((mutations) => {
          const hasNewFavicon = Array.from(document.querySelectorAll('link[rel*="icon"]')).some(
            (link) => !link.hasAttribute("data-blocked")
          );

          // Kiểm tra title bị đổi lại
          const titleChanged = document.title !== titleTab;

          if (hasNewFavicon || titleChanged) removeFavicon();
        });

        if (document.head) {
          headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
        }
      }

      // ====== ẨN QUẢNG CÁO ======
      function processAds() {
        if (!hideAds) return;

        AD_SELECTORS.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            if (shouldIgnore(el)) return;

            if (!el.hasAttribute("data-ad-processed")) {
              const computed = window.getComputedStyle(el);
              const width = computed.width;
              const height = computed.height;

              el.setAttribute("data-ad-processed", "true");

              if (!hideAdsComplete) {
                if (width && width !== "auto") el.style.setProperty("width", width, "important");
                if (height && height !== "auto") el.style.setProperty("height", height, "important");
                el.innerHTML = "";
              }
            }
          });
        });
      }

      // ====== PHÁT HIỆN QUẢNG CÁO BẰNG HEURISTIC ======
      function processHeuristicAds() {
        // bỏ
        return;

        if (!hideAds) return;

        // Iframe không có src hoặc src từ domain lạ
        document.querySelectorAll("iframe:not([data-ad-processed])").forEach((iframe) => {
          if (shouldIgnore(iframe)) return;

          const src = iframe.getAttribute("src") || "";
          const id = iframe.id || "";
          const hasNoSrc = !src || src === "";
          const isAdDomain = /doubleclick|googlesyndication|adnxs|taboola|outbrain|avalanche|bncloudfl/i.test(src);
          const isAdId = /clb-spot|ad|banner|pop/i.test(id);

          const style = window.getComputedStyle(iframe);
          const w = parseInt(style.width) || 0;
          const h = parseInt(style.height) || 0;
          const isAdSize =
            (w === 300 && h === 250) ||
            (w === 728 && h === 90) ||
            (w === 160 && h === 600) ||
            (w === 320 && h === 50) ||
            (w === 970 && h === 250);

          if (isAdDomain || isAdId || (hasNoSrc && isAdSize)) {
            iframe.setAttribute("data-ad-processed", "true");
          }
        });

        // Container chứa script quảng cáo
        document.querySelectorAll("script[src]").forEach((script) => {
          const src = script.getAttribute("src") || "";
          if (/avalanche|bncloudfl|adsbygoogle|doubleclick|googlesyndication/i.test(src)) {
            const parent = script.parentElement;
            if (parent && !parent.hasAttribute("data-ad-processed")) {
              parent.setAttribute("data-ad-processed", "true");

              if (!hideAdsComplete) {
                const computed = window.getComputedStyle(parent);
                if (computed.width && computed.width !== "auto")
                  parent.style.setProperty("width", computed.width, "important");
                if (computed.height && computed.height !== "auto")
                  parent.style.setProperty("height", computed.height, "important");
                parent.innerHTML = "";
              }
            }
          }
        });

        // Div chứa chỉ iframe đã bị xử lý
        document.querySelectorAll("div:not([data-ad-processed])").forEach((div) => {
          if (shouldIgnore(div)) return;

          const children = div.children;
          if (children.length === 1 && children[0].tagName === "IFRAME") {
            const iframe = children[0];
            if (iframe.hasAttribute("data-ad-processed")) {
              div.setAttribute("data-ad-processed", "true");
            }
          }
        });
      }

      // ====== ẨN ẢNH ======
      let imageProcessing = false;

      function processImages() {
        if (!hideImages || imageProcessing) return;
        imageProcessing = true;

        requestAnimationFrame(() => {
          // Xử lý <img>
          document.querySelectorAll("img").forEach((i) => {
            if (shouldIgnore(i)) return;

            if (!i.hasAttribute("data-processed")) {
              i.setAttribute("data-processed", "true");

              if (!hideImagesComplete) {
                let width = 50;
                let height = 50;

                if (i.style.width) {
                  width = parseInt(i.style.width) || 50;
                } else if (i.width) {
                  width = i.width;
                } else if (i.naturalWidth) {
                  width = i.naturalWidth;
                }

                if (i.style.height) {
                  height = parseInt(i.style.height) || 50;
                } else if (i.height) {
                  height = i.height;
                } else if (i.naturalHeight) {
                  height = i.naturalHeight;
                }

                i.removeAttribute("src");
                i.removeAttribute("srcset");
                i.removeAttribute("alt");

                i.style.setProperty("width", width + "px", "important");
                i.style.setProperty("height", height + "px", "important");
                i.style.setProperty("min-width", "50px", "important");
                i.style.setProperty("min-height", "50px", "important");
              }
            }
          });

          // Xử lý background-image
          document.querySelectorAll("*:not([data-bg-processed])").forEach((el) => {
            if (shouldIgnore(el)) return;

            const style = window.getComputedStyle(el);
            if (
              (style.backgroundImage && style.backgroundImage.includes("url(")) ||
              (style.background && style.background.includes("url("))
            ) {
              el.setAttribute("data-bg-processed", "true");

              if (!hideImagesComplete) {
                const width = style.width;
                const height = style.height;
                if (width && width !== "auto" && width !== "0px") el.style.setProperty("width", width, "important");
                if (height && height !== "auto" && height !== "0px")
                  el.style.setProperty("height", height, "important");
              }
            }
          });

          imageProcessing = false;
        });
      }

      // ====== ẨN BACKGROUND CÓ MÀU ======
      let backgroundProcessing = false;

      function processBackgrounds() {
        if (!normalizeColor || backgroundProcessing) return;
        backgroundProcessing = true;

        requestAnimationFrame(() => {
          document.querySelectorAll("*:not([data-bg-color-processed])").forEach((el) => {
            if (shouldIgnore(el)) return;

            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;

            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
              el.setAttribute("data-bg-color-processed", "true");
            }
          });

          backgroundProcessing = false;
        });
      }

      // ====== XỬ LÝ OVERLAY TOÀN MÀN HÌNH ======
      function processOverlays() {
        if (!hideAds) return;

        let removedCount = 0;

        OVERLAY_SELECTORS.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            if (shouldIgnore(el)) return;
            if (el.hasAttribute("data-overlay-processed")) return;

            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex) || 0;
            const isFixed = style.position === "fixed" || style.position === "absolute";
            const isFullScreen =
              style.width.includes("100") ||
              style.height.includes("100") ||
              (el.offsetWidth >= window.innerWidth * 0.9 && el.offsetHeight >= window.innerHeight * 0.9);

            if (isFixed && (isFullScreen || zIndex > 900)) {
              el.setAttribute("data-overlay-processed", "true");

              if (hideAdsComplete) {
                el.remove();
              }
              removedCount++;
            }
          });
        });

        if (removedCount === 0) {
          CLOSE_BUTTON_SELECTORS.forEach((selector) => {
            document.querySelectorAll(selector).forEach((btn) => {
              if (btn.offsetParent !== null && !btn.hasAttribute("data-clicked")) {
                btn.setAttribute("data-clicked", "true");
                btn.click();
              }
            });
          });
        }

        unlockBody();
      }

      function unlockBody() {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.height = "";
        document.documentElement.style.overflow = "";

        document.body.classList.remove("no-scroll", "modal-open", "overflow-hidden");
        document.documentElement.classList.remove("no-scroll", "modal-open");
      }

      // ====== KHỞI CHẠY ======
      function runAll() {
        normalizeColors();
        processAds();
        processHeuristicAds();
        processImages();
        processBackgrounds();
        processOverlays();
      }

      // ====== ĐỢI DOCUMENT.BODY SẴN SÀNG ======
      function initWhenReady() {
        if (document.body) {
          injectBlockerCSS();
          setupFavicon();
          runAll();

          setTimeout(() => processOverlays(), 2000);
          setTimeout(() => processOverlays(), 5000);

          setInterval(runAll, SCAN_INTERVAL);

          let observerTimeout;
          const observer = new MutationObserver(() => {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(runAll, 500);
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        } else {
          const bodyWaiter = new MutationObserver(() => {
            if (document.body) {
              bodyWaiter.disconnect();
              initWhenReady();
            }
          });
          bodyWaiter.observe(document.documentElement, {
            childList: true,
          });
        }
      }

      initWhenReady();
    }
  }
);
