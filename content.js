const normalTextColor = "#444444";
const normalBorderColor = "#999999";
const normalBackgroundColor = "#cccccc";

// ====== CHẶN ẢNH SỚM NHẤT ======
(function() {
  const style = document.createElement('style');
  style.id = 'early-image-blocker';
  style.textContent = `
    img {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
})();

// ====== CHẶN <IMG> NGAY KHI THÊM VÀO DOM ======
const earlyImageObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === 'IMG') {
        node.style.opacity = '0';
        node.style.pointerEvents = 'none';
      }
      if (node.querySelectorAll) {
        node.querySelectorAll('img').forEach(img => {
          img.style.opacity = '0';
          img.style.pointerEvents = 'none';
        });
      }
    });
  });
});

if (document.documentElement) {
  earlyImageObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

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
    const domain = location.hostname.replace(/^www\./, "");

    // ====== HÀM KIỂM TRA BỎ QUA ======
    function shouldIgnore(el) {
      // Kiểm tra ignoreClasses (từ user input)
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

      // Kiểm tra whitelist - AN TOÀN với mọi element
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

    if (blockSites.some((site) => domain.endsWith(site))) {
      // ====== NORMALIZE COLOR ======
      if (normalizeColor) {
        let colorProcessing = false;

        function normalizeColors() {
          if (colorProcessing) return;
          colorProcessing = true;

          requestAnimationFrame(() => {
            document.querySelectorAll("*").forEach((el) => {
              if (shouldIgnore(el)) return;

              if (!el.hasAttribute("data-color-normalized")) {
                el.setAttribute("data-color-normalized", "true");
                el.style.color = normalTextColor;

                const style = window.getComputedStyle(el);
                if (style.borderWidth && style.borderWidth !== "0px") {
                  el.style.borderColor = normalBorderColor;
                }
              }
            });
            colorProcessing = false;
          });
        }

        normalizeColors();

        const colorObserver = new MutationObserver(() => {
          normalizeColors();
        });
        colorObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }

      // ====== ẨN FAVICON ======
      if (hideFavicon) {
        let headObserver;
        let faviconProcessing = false;

        function removeFavicon() {
          if (faviconProcessing) return;
          faviconProcessing = true;

          if (headObserver) {
            headObserver.disconnect();
          }

          document.querySelectorAll('link[rel*="icon"]').forEach((link) => {
            if (!link.hasAttribute("data-blocked")) {
              link.remove();
            }
          });

          if (!document.querySelector('link[data-blocked="true"]')) {
            const emptyFavicon = document.createElement("link");
            emptyFavicon.rel = "icon";
            emptyFavicon.href = "data:,";
            emptyFavicon.setAttribute("data-blocked", "true");
            document.head.appendChild(emptyFavicon);
          }

          if (headObserver) {
            headObserver.observe(document.head, { childList: true });
          }

          faviconProcessing = false;
        }

        removeFavicon();

        headObserver = new MutationObserver(() => {
          const hasNewFavicon = Array.from(document.querySelectorAll('link[rel*="icon"]')).some(
            (link) => !link.hasAttribute("data-blocked")
          );

          if (hasNewFavicon) {
            removeFavicon();
          }
        });

        headObserver.observe(document.head, { childList: true });
      }

      // ====== CẤU HÌNH SELECTOR QUẢNG CÁO/POPUP ======
      const AD_SELECTORS = [
        // ====== HIGH CONFIDENCE (Độ tin cậy cao) ======
        "ins.adsbygoogle",
        '[id^="google_ads"]',
        '[id^="div-gpt-ad"]',
        "[data-google-query-id]",
        "[data-ad-slot]",
        'iframe[src*="doubleclick.net"]',
        'iframe[src*="googlesyndication.com"]',
        'iframe[src*="googleadservices.com"]',

        // ====== SPECIFIC PATTERNS (Pattern cụ thể) ======
        '[id^="_pop-qqgo-"]',
        '[id^="sp-wrapper-hovering"]',
        '[id^="_ad-banner-"]',
        '[id^="_pop-"]',

        // ====== CLASS-BASED (Bắt đầu/kết thúc) ======
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

        // ====== ID-BASED (Bắt đầu) ======
        '[id^="ad-"]',
        '[id^="ads-"]',
        '[id^="adv-"]',
        '[id^="banner-"]',
        '[id^="popup-"]',
        '[id^="sponsor-"]',

        // ====== COMBINED CONDITIONS (Kết hợp điều kiện) ======
        'div[class*="ad"][class*="wrapper"]',
        'div[class*="ad"][class*="container"]',
        'aside[class*="ad"]',
        'section[class*="sponsored"]',

        // ====== STYLE-BASED (Popup overlay) ======
        'div[style*="position: fixed"][style*="z-index: 9999"]',
        'div[style*="position: fixed"][style*="z-index: 999999"]',

        // ====== IFRAME ADS ======
        'iframe[id*="google_ads"]',
        'iframe[src*="/ad/"]',
        'iframe[src*="/ads/"]',
        'iframe[src*="adnxs.com"]',
        'iframe[src*="taboola.com"]',
        'iframe[src*="outbrain.com"]',

        // ====== ATTRIBUTE-BASED ======
        "[data-ad]",
        "[data-ads]",
        "[data-ad-client]",
      ];

      const SCAN_INTERVAL = 3000;

      // ====== ẨN QUẢNG CÁO ======
      function processAds() {
        if (!hideAds) return;

        AD_SELECTORS.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            if (shouldIgnore(el)) return;

            if (!el.hasAttribute("data-ad-processed")) {
              el.setAttribute("data-ad-processed", "true");

              if (hideAdsComplete) {
                el.style.display = "none";
              } else {
                const computed = window.getComputedStyle(el);
                const width = computed.width;
                const height = computed.height;

                if (width && width !== "auto") el.style.width = width;
                if (height && height !== "auto") el.style.height = height;

                el.style.backgroundColor = normalBackgroundColor;
                el.style.border = "1px dashed " + normalBorderColor;
                el.innerHTML = "";
              }
            }
          });
        });
      }

      // ====== ẨN ẢNH ======
      let imageProcessing = false;

      function processImages() {
        if (!hideImages || imageProcessing) return;
        imageProcessing = true;

        requestAnimationFrame(() => {
          // ✅ XỬ LÝ TẤT CẢ <img>
          document.querySelectorAll("img").forEach((i) => {
            if (shouldIgnore(i)) return;

            if (!i.hasAttribute("data-processed")) {
              i.setAttribute("data-processed", "true");
            }

            if (hideImagesComplete) {
              i.style.display = "none";
            } else {
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

              i.style.width = width + "px";
              i.style.height = height + "px";
              i.style.backgroundColor = normalBackgroundColor;
              i.style.border = "1px dashed " + normalBorderColor;
              i.style.minWidth = "50px";
              i.style.minHeight = "50px";
              i.style.opacity = "1";
              i.style.pointerEvents = "auto";
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

              if (hideImagesComplete) {
                el.style.display = "none";
              } else {
                const width = style.width;
                const height = style.height;

                if (width && width !== "auto" && width !== "0px") el.style.width = width;
                if (height && height !== "auto" && height !== "0px") el.style.height = height;

                el.style.backgroundImage = "none";
                el.style.backgroundColor = normalBackgroundColor;
                el.style.border = "1px dashed " + normalBorderColor;
              }
            }
          });

          // ✅ XÓA CSS BLOCKER SAU KHI XỬ LÝ XONG
          const earlyBlocker = document.getElementById('early-image-blocker');
          if (earlyBlocker) {
            earlyBlocker.remove();
          }

          // ✅ DỪNG EARLY OBSERVER
          if (typeof earlyImageObserver !== 'undefined') {
            earlyImageObserver.disconnect();
          }

          imageProcessing = false;
        });
      }

      // ====== ẨN BACKGROUND CÓ MÀU ======
      let backgroundProcessing = false;

      function processBackgrounds() {
        if (backgroundProcessing) return;
        backgroundProcessing = true;

        requestAnimationFrame(() => {
          document.querySelectorAll("*:not([data-bg-color-processed])").forEach((el) => {
            if (shouldIgnore(el)) return;

            const style = window.getComputedStyle(el);
            const bg = style.backgroundColor;

            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
              el.setAttribute("data-bg-color-processed", "true");
              el.style.backgroundColor = normalBackgroundColor;
            }
          });

          backgroundProcessing = false;
        });
      }

      // ====== XỬ LÝ OVERLAY TOÀN MÀN HÌNH ======
      function processOverlays() {
        if (!hideAds) return;

        let removedCount = 0;

        // Xóa overlay
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
                removedCount++;
              } else {
                el.style.display = "none";
                removedCount++;
              }
            }
          });
        });

        // Tự động click nút đóng (nếu không xóa được overlay)
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

        // Khôi phục scroll
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

      // ====== CHẠY NGAY KHI LOAD ======
      processAds();
      processImages();
      processBackgrounds();
      processOverlays();

      // Xử lý overlay xuất hiện sau vài giây
      setTimeout(() => {
        processOverlays();
      }, 2000);

      setTimeout(() => {
        processOverlays();
      }, 5000);

      // ====== QUÉT ĐỊNH KỲ ======
      setInterval(() => {
        processAds();
        processImages();
        processBackgrounds();
        processOverlays();
      }, SCAN_INTERVAL);

      // ====== THEO DÕI DOM ======
      let observerTimeout;
      const observer = new MutationObserver(() => {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
          processAds();
          processImages();
          processBackgrounds();
          processOverlays();
        }, 500);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }
);
