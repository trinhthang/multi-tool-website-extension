const titleTab = "MISA";
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// ====== THEME COLORS ======
const THEMES = {
  dark: {
    textColor: "#D4D4C8",
    borderColor: "#4A4A42",
    backgroundColor: "#2B2B28",
  },
  light: {
    textColor: "#3D3D3D",
    borderColor: "#B8B8B0",
    backgroundColor: "#EEEADE",
  },
};

// ====== WHITELIST (Bỏ qua) ======
const WHITELIST_PATTERNS = [];

// ====== OVERLAY SELECTORS ======
const OVERLAY_SELECTORS = [
  'div[style*="position: fixed"][style*="width: 100"]',
  'div[style*="position: fixed"][style*="height: 100"]',
  'div[style*="position: absolute"][style*="width: 100"]',
  // '[style*="z-index: 999"]',
  // '[style*="z-index: 9999"]',
  // '[style*="z-index: 99999"]',
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

// ====== RESOLVE THEME ======
function resolveTheme(themeMode) {
  if (themeMode === "dark") return THEMES.dark;
  if (themeMode === "light") return THEMES.light;
  // system: detect từ OS
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return THEMES.dark;
  }
  return THEMES.light;
}

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
    themeMode: "system",
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
    const themeMode = data.themeMode || "system";
    const domain = location.hostname.replace(/^www\./, "");

    // Resolve theme colors
    const theme = resolveTheme(themeMode);
    const normalTextColor = theme.textColor;
    const normalBorderColor = theme.borderColor;
    const normalBackgroundColor = theme.backgroundColor;

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
          [data-color-normalized][data-color-normalized] {
            color: ${normalTextColor} !important;
          }
          [data-border-normalized][data-border-normalized] {
            border-color: ${normalBorderColor} !important;
          }
          [data-bg-color-processed][data-bg-color-processed] {
            background-color: ${normalBackgroundColor} !important;
            background-image: none !important;
            background: ${normalBackgroundColor} !important;
            box-shadow: none !important;
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
        // 'div[style*="position: fixed"][style*="z-index: 9999"]',
        // 'div[style*="position: fixed"][style*="z-index: 999999"]',

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

                i.src = TRANSPARENT_PIXEL;
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
            const bgImage = style.backgroundImage;

            const hasColor = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
            const hasGradient = bgImage && bgImage !== "none" && bgImage.includes("gradient");

            if (hasColor || hasGradient) {
              el.setAttribute("data-bg-color-processed", "true");
              el.style.setProperty("background-color", normalBackgroundColor, "important");

              // ✅ Xóa gradient/background-image
              if (hasGradient) {
                el.style.setProperty("background-image", "none", "important");
                el.style.setProperty("background", normalBackgroundColor, "important");
              }
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

// ============================================================
// READER MODE
// ============================================================

let easyviewReaderActive = false;

// ====== TRÍCH XUẤT NỘI DUNG CHÍNH ======
function extractMainContent() {
  // Ưu tiên 1: Selector phổ biến của các site truyện/bài viết
  const knownSelectors = [
    ".chapter-content",
    ".story-content",
    "#chapter-content",
    ".chapter_content",
    ".reading-content",
    ".content-chapter",
    ".truyen-content",
    ".novel-content",
    ".entry-content",
    ".post-content",
    ".article-content",
    ".main-content",
    ".blog-content",
    "article .entry-content",
    '[role="main"] article',
    "article",
    '[role="main"]',
    "main",
  ];

  for (const sel of knownSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim().length > 200) {
      return el;
    }
  }

  // Ưu tiên 2: Heuristic scoring
  return heuristicExtract();
}

function heuristicExtract() {
  const candidates = document.querySelectorAll("div, section, article, main, td");
  let bestNode = null;
  let bestScore = 0;

  // Keyword tích cực (nội dung chính)
  const positiveRe = /content|article|chapter|story|post|entry|text|body|main|reading|novel|truyen/i;
  // Keyword tiêu cực (sidebar, nav, ads,...)
  const negativeRe =
    /sidebar|nav|menu|footer|header|comment|ad|banner|widget|social|share|related|recommend|popup|modal|overlay|login|signup/i;

  candidates.forEach((node) => {
    // Bỏ qua node quá nhỏ
    const text = node.textContent || "";
    if (text.trim().length < 200) return;

    // Bỏ qua node ẩn
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return;

    let score = 0;

    // Điểm dựa trên lượng text
    const textLen = text.trim().length;
    score += Math.min(textLen / 100, 50); // max 50 điểm từ text length

    // Điểm dựa trên số <p> con
    const pCount = node.querySelectorAll("p").length;
    score += pCount * 3;

    // Điểm dựa trên số <br> (truyện chữ VN hay dùng br)
    const brCount = node.querySelectorAll("br").length;
    score += Math.min(brCount, 30);

    // Tỷ lệ text / link (nhiều link = nav/sidebar)
    const linkText = Array.from(node.querySelectorAll("a"))
      .map((a) => a.textContent.trim())
      .join("").length;
    const linkRatio = linkText / (textLen || 1);
    if (linkRatio > 0.5) score -= 30;

    // Class/ID scoring
    const classId = (node.className || "") + " " + (node.id || "");
    if (positiveRe.test(classId)) score += 25;
    if (negativeRe.test(classId)) score -= 30;

    // Ưu tiên node không quá sâu
    let depth = 0;
    let p = node;
    while (p.parentElement) {
      depth++;
      p = p.parentElement;
    }
    if (depth > 15) score -= 10;

    // Ưu tiên <article> và <main>
    const tag = node.tagName.toLowerCase();
    if (tag === "article") score += 15;
    if (tag === "main") score += 10;

    if (score > bestScore) {
      bestScore = score;
      bestNode = node;
    }
  });

  return bestNode;
}

// ====== LẤY TIÊU ĐỀ ======
function extractTitle() {
  // Thử các selector phổ biến
  const titleSelectors = [
    "h1.chapter-title",
    "h1.story-title",
    ".chapter-name",
    ".truyen-title",
    "h1",
    "h2.title",
    ".entry-title",
    ".post-title",
  ];

  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim().length > 0) {
      return el.textContent.trim();
    }
  }

  return document.title || "Reader Mode";
}

// ====== CÀI ĐẶT READER MẶC ĐỊNH ======
const READER_DEFAULTS = {
  font: "Georgia, serif",
  fontSize: 20,
  lineHeight: 1.8,
  maxWidth: 700,
  theme: "light", // light | sepia | dark
  textAlign: "justify",
};

// Load reader settings từ storage
let readerSettings = { ...READER_DEFAULTS };

function loadReaderSettings(callback) {
  chrome.storage.sync.get({ readerSettings: null }, (data) => {
    if (data.readerSettings) {
      readerSettings = { ...READER_DEFAULTS, ...data.readerSettings };
    }
    if (callback) callback();
  });
}

function saveReaderSettings() {
  chrome.storage.sync.set({ readerSettings });
}

// ====== THEME CONFIGS ======
const READER_THEMES = {
  light: { bg: "#ffffff", text: "#1a1a2e", toolbarBg: "#f8f9fb", border: "#e0e0e0" },
  sepia: { bg: "#f4ecd8", text: "#5b4636", toolbarBg: "#ebe0cc", border: "#d4c5a9" },
  dark: { bg: "#1a1a2e", text: "#d4d4d4", toolbarBg: "#16213e", border: "#2a2a4a" },
};

// ====== TẠO READER OVERLAY ======
function createReaderOverlay(contentNode, title) {
  // Xóa overlay cũ nếu có
  removeReaderOverlay();

  const theme = READER_THEMES[readerSettings.theme] || READER_THEMES.light;

  // Container chính
  const overlay = document.createElement("div");
  overlay.id = "easyview-reader-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2147483647;
    background: ${theme.bg};
    color: ${theme.text};
    overflow-y: auto;
    overflow-x: hidden;
    font-family: ${readerSettings.font};
    font-size: ${readerSettings.fontSize}px;
    line-height: ${readerSettings.lineHeight};
    text-align: ${readerSettings.textAlign};
  `;

  // ====== TOOLBAR ======
  const toolbar = document.createElement("div");
  toolbar.id = "easyview-reader-toolbar";
  toolbar.style.cssText = `
    position: sticky;
    top: 0;
    z-index: 2147483647;
    background: ${theme.toolbarBg};
    border-bottom: 1px solid ${theme.border};
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 13px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  `;

  // Nút thoát
  const closeBtn = createToolbarBtn("✕ Thoát", () => {
    removeReaderOverlay();
  });
  closeBtn.style.cssText += "background:#ea4335;color:#fff;border:none;font-weight:700;";

  // Font selector
  const fontSelect = document.createElement("select");
  fontSelect.style.cssText = toolbarSelectStyle();
  const fonts = [
    { label: "Serif", value: "Georgia, serif" },
    { label: "Sans", value: "'Segoe UI', sans-serif" },
    { label: "Mono", value: "'Cascadia Code', monospace" },
  ];
  fonts.forEach((f) => {
    const opt = document.createElement("option");
    opt.value = f.value;
    opt.textContent = f.label;
    if (readerSettings.font === f.value) opt.selected = true;
    fontSelect.appendChild(opt);
  });
  fontSelect.addEventListener("change", () => {
    readerSettings.font = fontSelect.value;
    updateReaderStyle();
    saveReaderSettings();
  });

  // Cỡ chữ -/+
  const fontMinus = createToolbarBtn("A−", () => {
    readerSettings.fontSize = Math.max(12, readerSettings.fontSize - 2);
    updateReaderStyle();
    saveReaderSettings();
  });
  const fontPlus = createToolbarBtn("A+", () => {
    readerSettings.fontSize = Math.min(40, readerSettings.fontSize + 2);
    updateReaderStyle();
    saveReaderSettings();
  });

  // Theme buttons
  const themeLight = createToolbarBtn("☀️", () => switchReaderTheme("light"));
  const themeSepia = createToolbarBtn("📜", () => switchReaderTheme("sepia"));
  const themeDark = createToolbarBtn("🌙", () => switchReaderTheme("dark"));

  // Width selector
  const widthSelect = document.createElement("select");
  widthSelect.style.cssText = toolbarSelectStyle();
  const widths = [
    { label: "Hẹp", value: 550 },
    { label: "Vừa", value: 700 },
    { label: "Rộng", value: 900 },
    { label: "Full", value: 9999 },
  ];
  widths.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.value;
    opt.textContent = w.label;
    if (readerSettings.maxWidth === w.value) opt.selected = true;
    widthSelect.appendChild(opt);
  });
  widthSelect.addEventListener("change", () => {
    readerSettings.maxWidth = parseInt(widthSelect.value);
    updateReaderStyle();
    saveReaderSettings();
  });

  // Align toggle
  const alignBtn = createToolbarBtn(readerSettings.textAlign === "justify" ? "≡" : "☰", () => {
    readerSettings.textAlign = readerSettings.textAlign === "justify" ? "left" : "justify";
    alignBtn.textContent = readerSettings.textAlign === "justify" ? "≡" : "☰";
    updateReaderStyle();
    saveReaderSettings();
  });
  alignBtn.title = "Căn lề";

  toolbar.append(
    closeBtn,
    separator(),
    fontSelect,
    fontMinus,
    fontPlus,
    separator(),
    themeLight,
    themeSepia,
    themeDark,
    separator(),
    widthSelect,
    alignBtn
  );

  // ====== NỘI DUNG ======
  const contentWrapper = document.createElement("div");
  contentWrapper.id = "easyview-reader-content";
  contentWrapper.style.cssText = `
    max-width: ${readerSettings.maxWidth}px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  `;

  // Tiêu đề
  if (title) {
    const h1 = document.createElement("h1");
    h1.textContent = title;
    h1.style.cssText = `
      font-size: 1.6em;
      margin-bottom: 24px;
      line-height: 1.3;
      text-align: center;
      font-weight: 700;
    `;
    contentWrapper.appendChild(h1);
  }

  // Clone nội dung
  const cloned = contentNode.cloneNode(true);

  // Cleanup: xóa script, style, iframe, ads trong clone
  cloned.querySelectorAll("script, style, iframe, .ads, .ad, [class*='adsbygoogle']").forEach((el) => el.remove());

  // Reset style inline của các element con
  cloned.querySelectorAll("*").forEach((el) => {
    el.style.maxWidth = "100%";
    // Giữ lại ảnh nếu có
    if (el.tagName === "IMG") {
      el.style.height = "auto";
      el.style.display = "block";
      el.style.margin = "16px auto";
    }
  });

  contentWrapper.appendChild(cloned);

  // ====== PROGRESS BAR ======
  const progressBar = document.createElement("div");
  progressBar.id = "easyview-reader-progress";
  progressBar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 3px;
    background: linear-gradient(90deg, #4a90d9, #7c4dff);
    z-index: 2147483648;
    transition: width 0.1s;
    width: 0%;
  `;

  // Assemble
  overlay.appendChild(toolbar);
  overlay.appendChild(contentWrapper);
  document.body.appendChild(overlay);
  document.body.appendChild(progressBar);

  // Scroll progress
  overlay.addEventListener("scroll", () => {
    const scrollTop = overlay.scrollTop;
    const scrollHeight = overlay.scrollHeight - overlay.clientHeight;
    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
  });

  // Prevent body scroll
  document.body.style.overflow = "hidden";

  easyviewReaderActive = true;
}

// ====== XÓA READER OVERLAY ======
function removeReaderOverlay() {
  const overlay = document.getElementById("easyview-reader-overlay");
  const progress = document.getElementById("easyview-reader-progress");
  if (overlay) overlay.remove();
  if (progress) progress.remove();
  document.body.style.overflow = "";
  easyviewReaderActive = false;
}

// ====== CẬP NHẬT STYLE READER ======
function updateReaderStyle() {
  const overlay = document.getElementById("easyview-reader-overlay");
  const toolbar = document.getElementById("easyview-reader-toolbar");
  const content = document.getElementById("easyview-reader-content");
  if (!overlay) return;

  const theme = READER_THEMES[readerSettings.theme] || READER_THEMES.light;

  overlay.style.background = theme.bg;
  overlay.style.color = theme.text;
  overlay.style.fontFamily = readerSettings.font;
  overlay.style.fontSize = readerSettings.fontSize + "px";
  overlay.style.lineHeight = readerSettings.lineHeight;
  overlay.style.textAlign = readerSettings.textAlign;

  if (toolbar) {
    toolbar.style.background = theme.toolbarBg;
    toolbar.style.borderBottomColor = theme.border;
  }

  if (content) {
    content.style.maxWidth = readerSettings.maxWidth + "px";
  }
}

function switchReaderTheme(themeName) {
  readerSettings.theme = themeName;
  updateReaderStyle();
  saveReaderSettings();
}

// ====== HELPER: TẠO NÚT TOOLBAR ======
function createToolbarBtn(text, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.style.cssText = `
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #333;
    transition: background 0.15s;
    line-height: 1;
  `;
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#e8eaed";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#fff";
  });
  btn.addEventListener("click", onClick);
  return btn;
}

function toolbarSelectStyle() {
  return `
    padding: 5px 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    font-size: 12px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    cursor: pointer;
    color: #333;
    outline: none;
  `;
}

function separator() {
  const s = document.createElement("div");
  s.style.cssText = "width:1px;height:20px;background:#ddd;margin:0 4px;";
  return s;
}

// ============================================================
// BLUR MODE (CHỐNG NHÌN TRỘM)
// ============================================================

let easyviewBlurActive = false;
let blurRadius = 150; // px - bán kính vùng rõ
let blurAmount = 12; // px - độ blur

// ====== BẬT BLUR MODE ======
function enableBlurMode() {
  if (easyviewBlurActive) return;

  // Inject CSS
  const style = document.createElement("style");
  style.id = "easyview-blur-style";
  style.textContent = `
    /* Blur toàn bộ body */
    body.easyview-blur-active {
      cursor: none !important;
    }

    body.easyview-blur-active > *:not(#easyview-blur-spotlight):not(#easyview-blur-indicator) {
      filter: blur( ${blurAmount}px) !important;
      transition: filter 0.05s ease !important;
      pointer-events: auto !important;
    }

    /* Spotlight circle theo chuột */
    #easyview-blur-spotlight {
      position: fixed;
      pointer-events: none;
      z-index: 2147483646;
      border-radius: 50%;
      width: ${blurRadius * 2}px;
      height: ${blurRadius * 2}px;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.01);
      mix-blend-mode: normal;
      display: none;
    }

    /* Indicator góc trên phải */
    #easyview-blur-indicator {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      background: rgba(255, 109, 0, 0.9);
      color: #fff;
      padding: 6px 14px;
      border-radius: 20px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      user-select: none;
      cursor: pointer;
    }

    #easyview-blur-indicator:hover {
      background: rgba(234, 67, 53, 0.95);
    }
  `;
  document.head.appendChild(style);

  // Tạo spotlight element
  const spotlight = document.createElement("div");
  spotlight.id = "easyview-blur-spotlight";
  document.body.appendChild(spotlight);

  // Tạo indicator
  const indicator = document.createElement("div");
  indicator.id = "easyview-blur-indicator";
  indicator.innerHTML = `🫣 Chống nhìn trộm <span style="opacity:0.7;font-size:11px">(ESC tắt | Scroll ± size)</span>`;
  indicator.addEventListener("click", () => disableBlurMode());
  document.body.appendChild(indicator);

  // Thêm class vào body
  document.body.classList.add("easyview-blur-active");

  // ====== MASK APPROACH: dùng clip-path trên body ======

  // Hình tròn
  // Thay vì blur từng element, dùng 1 lớp overlay đen mờ + lỗ tròn
  // const overlay = document.createElement("div");
  // overlay.id = "easyview-blur-overlay";
  // overlay.style.cssText = `
  //   position: fixed;
  //   top: 0; left: 0; right: 0; bottom: 0;
  //   z-index: 2147483645;
  //   pointer-events: none;
  //   backdrop-filter: blur( ${blurAmount}px);
  //   -webkit-backdrop-filter: blur( ${blurAmount}px);
  //   mask-image: radial-gradient(circle ${blurRadius}px at var(--mx, -9999px) var(--my, -9999px), transparent 0%, transparent 100%, black 100%);
  //   -webkit-mask-image: radial-gradient(circle ${blurRadius}px at var(--mx, -9999px) var(--my, -9999px), transparent 0%, transparent 100%, black 100%);
  // `;
  // document.body.appendChild(overlay);

  // Hình chữ nhật
  const overlay = document.createElement("div");
  overlay.id = "easyview-blur-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2147483645;
    pointer-events: none;
    backdrop-filter: blur( ${blurAmount}px);
    -webkit-backdrop-filter: blur( ${blurAmount}px);
  `;
  // Mask sẽ được set bởi mousemove
  document.body.appendChild(overlay);

  // Xóa CSS blur trên body children (dùng overlay thay thế)
  style.textContent = `
    body.easyview-blur-active {
      cursor: none !important;
    }

    #easyview-blur-indicator {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 2147483647;
      background: rgba(255, 109, 0, 0.9);
      color: #fff;
      padding: 6px 14px;
      border-radius: 20px;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
      user-select: none;
      cursor: pointer;
    }

    #easyview-blur-indicator:hover {
      background: rgba(234, 67, 53, 0.95);
    }
  `;

  // Mouse move handler
  // window._easyviewBlurMouseMove = (e) => {
  //   const overlay = document.getElementById("easyview-blur-overlay");
  //   if (overlay) {
  //     overlay.style.setProperty("--mx", e.clientX + "px");
  //     overlay.style.setProperty("--my", e.clientY + "px");
  //   }
  // };
  // Kích thước vùng rõ (nửa chiều rộng, nửa chiều cao)
  let blurRectW = blurRadius * 1.6; // chiều rộng / 2
  let blurRectH = blurRadius; // chiều cao / 2

  window._easyviewBlurMouseMove = (e) => {
    const overlay = document.getElementById("easyview-blur-overlay");
    if (!overlay) return;

    const x = e.clientX;
    const y = e.clientY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Tính tọa độ 4 góc vùng rõ (clamp trong viewport)
    const left = Math.max(0, x - blurRectW);
    const top = Math.max(0, y - blurRectH);
    const right = Math.min(vw, x + blurRectW);
    const bottom = Math.min(vh, y + blurRectH);

    // Chuyển sang % cho inset()
    const l = (left / vw) * 100;
    const t = (top / vh) * 100;
    const r = 100 - (right / vw) * 100;
    const b = 100 - (bottom / vh) * 100;

    // mask: đen = blur, trong suốt = rõ
    // inset(top right bottom left round border-radius)
    const maskVal = `inset( ${t}% ${r}% ${b}% ${l}% round 8px)`;

    // Đảo ngược: vùng inset là vùng HIỆN, ta cần vùng inset là vùng ẨN blur
    // Dùng composite: exclude để đục lỗ
    overlay.style.maskImage = maskVal;
    overlay.style.webkitMaskImage = maskVal;
    overlay.style.maskComposite = "exclude";
    overlay.style.webkitMaskComposite = "destination-out";

    // Cách đơn giản hơn: dùng mask với linear-gradient kết hợp
    // Nhưng inset exclude không hoạt động đơn lẻ → dùng polygon thay thế

    // ===== POLYGON APPROACH (chắc chắn hoạt động) =====
    // Tạo polygon bao quanh viewport nhưng đục lỗ hình chữ nhật
    const poly = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${l}% ${t}%, ${l}% ${100 - b}%, ${100 - r}% ${100 - b}%, ${100 - r}% ${t}%, ${l}% ${t}%
    )`;

    overlay.style.clipPath = poly;
    overlay.style.webkitClipPath = poly;
    // Xóa mask (dùng clip-path thay thế)
    overlay.style.maskImage = "none";
    overlay.style.webkitMaskImage = "none";
  };

  // Scroll để thay đổi bán kính
  // window._easyviewBlurWheel = (e) => {
  //   if (e.ctrlKey) {
  //     e.preventDefault();
  //     blurRadius = Math.max(50, Math.min(400, blurRadius + (e.deltaY > 0 ? -20 : 20)));
  //     updateBlurMask();
  //   }
  // };
  window._easyviewBlurWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -20 : 20;
      blurRadius = Math.max(50, Math.min(400, blurRadius + delta));
      blurRectW = blurRadius * 1.6;
      blurRectH = blurRadius;
    }
  };

  document.addEventListener("mousemove", window._easyviewBlurMouseMove);
  document.addEventListener("wheel", window._easyviewBlurWheel, { passive: false });

  easyviewBlurActive = true;
}

// ====== CẬP NHẬT MASK KHI THAY ĐỔI RADIUS ======
function updateBlurMask() {
  // const overlay = document.getElementById("easyview-blur-overlay");
  // if (!overlay) return;
  // const maskVal = `radial-gradient(circle ${blurRadius}px at var(--mx, -9999px) var(--my, -9999px), transparent 0%, transparent 100%, black 100%)`;
  // overlay.style.maskImage = maskVal;
  // overlay.style.webkitMaskImage = maskVal;
  // Không cần - polygon được cập nhật realtime trong mousemove
}

// ====== TẮT BLUR MODE ======
function disableBlurMode() {
  document.body.classList.remove("easyview-blur-active");

  const style = document.getElementById("easyview-blur-style");
  const spotlight = document.getElementById("easyview-blur-spotlight");
  const indicator = document.getElementById("easyview-blur-indicator");
  const overlay = document.getElementById("easyview-blur-overlay");

  if (style) style.remove();
  if (spotlight) spotlight.remove();
  if (indicator) indicator.remove();
  if (overlay) overlay.remove();

  if (window._easyviewBlurMouseMove) {
    document.removeEventListener("mousemove", window._easyviewBlurMouseMove);
    delete window._easyviewBlurMouseMove;
  }
  if (window._easyviewBlurWheel) {
    document.removeEventListener("wheel", window._easyviewBlurWheel);
    delete window._easyviewBlurWheel;
  }

  easyviewBlurActive = false;
}

// ====== LẮNG NGHE MESSAGE TỪ POPUP ======
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "toggleReaderMode") {
    if (easyviewReaderActive) {
      removeReaderOverlay();
      sendResponse({ active: false });
    } else {
      loadReaderSettings(() => {
        const contentNode = extractMainContent();
        if (!contentNode) {
          sendResponse({ active: false, error: "Không tìm thấy nội dung chính" });
          return;
        }
        const title = extractTitle();
        createReaderOverlay(contentNode, title);
        sendResponse({ active: true });
      });
    }
    return true; // async response
  }

  if (msg.action === "getReaderModeState") {
    sendResponse({ active: easyviewReaderActive });
    return false;
  }

  if (msg.action === "toggleBlurMode") {
    if (easyviewBlurActive) {
      disableBlurMode();
      sendResponse({ active: false });
    } else {
      enableBlurMode();
      sendResponse({ active: true });
    }
    return false;
  }

  if (msg.action === "getBlurModeState") {
    sendResponse({ active: easyviewBlurActive });
    return false;
  }
});

// ====== PHÍM TẮT: ESC ĐỂ THOÁT READER ======
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (easyviewReaderActive) {
      removeReaderOverlay();
    }
    if (easyviewBlurActive) {
      disableBlurMode();
    }
  }
});
