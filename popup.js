// popup.js
const textarea = document.getElementById("sites");
const ignoreClassesTextarea = document.getElementById("ignoreClasses");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const msg = document.getElementById("msg");
const hideImagesCheckbox = document.getElementById("hideImages");
const hideImagesCompleteCheckbox = document.getElementById("hideImagesComplete");
const hideImagesCompleteSub = document.getElementById("hideImagesCompleteSub");
const hideAdsCheckbox = document.getElementById("hideAds");
const hideAdsCompleteCheckbox = document.getElementById("hideAdsComplete");
const hideAdsCompleteSub = document.getElementById("hideAdsCompleteSub");
const hideFaviconCheckbox = document.getElementById("hideFavicon");
const normalizeColorCheckbox = document.getElementById("normalizeColor");
const imageScaleSlider = document.getElementById("imageScale");
const imageScaleValue = document.getElementById("imageScaleValue");
const fontScaleSlider = document.getElementById("fontScale");
const fontScaleValue = document.getElementById("fontScaleValue");

// ====== GIÁ TRỊ MẶC ĐỊNH ======
const DEFAULT_SITES = [
  "voz.vn",
  "bnsach.com",
  "truyenqqno.com",
  "nettruyen.work",
  "metruyen.fit",
  "truyenvn.shop",
  "wattpad.com",
  "webnovel.vn",
  "waka.vn",
  "truyenvv.com",
  "truyenfull.vision",
  "metruyenhot.vn",
  "truyenyy.co",
  "wikicv.net",
  "truyenplus.vn",
  "truyenqq.com.vn",
  "truyencom.com",
];

const DEFAULT_IGNORE_CLASSES = ["page-chapter", "chapter_control"];

// ====== RESET VỀ MẶC ĐỊNH ======
const DEFAULTS = {
  blockSites: DEFAULT_SITES,
  ignoreClasses: DEFAULT_IGNORE_CLASSES,
  hideImages: true,
  hideImagesComplete: true,
  hideAds: true,
  hideAdsComplete: true,
  hideFavicon: true,
  normalizeColor: true,
  imageScale: 100,
  fontScale: 100,
};

// Load
chrome.storage.sync.get(
  {
    blockSites: null,
    ignoreClasses: null,
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
    // Nếu chưa lưu lần nào → dùng default
    const sites = data.blockSites !== null ? data.blockSites : DEFAULT_SITES;
    const classes = data.ignoreClasses !== null ? data.ignoreClasses : DEFAULT_IGNORE_CLASSES;

    textarea.value = sites.join("\n");
    ignoreClassesTextarea.value = classes.join("\n");
    hideImagesCheckbox.checked = data.hideImages !== false;
    hideImagesCompleteCheckbox.checked = data.hideImagesComplete === true;
    hideAdsCheckbox.checked = data.hideAds !== false;
    hideAdsCompleteCheckbox.checked = data.hideAdsComplete === true;
    hideFaviconCheckbox.checked = data.hideFavicon === true;
    normalizeColorCheckbox.checked = data.normalizeColor === true;

    imageScaleSlider.value = data.imageScale || 100;
    imageScaleValue.textContent = (data.imageScale || 100) + "%";
    fontScaleSlider.value = data.fontScale || 100;
    fontScaleValue.textContent = (data.fontScale || 100) + "%";

    hideImagesCompleteSub.style.display = hideImagesCheckbox.checked ? "block" : "none";
    hideAdsCompleteSub.style.display = hideAdsCheckbox.checked ? "block" : "none";
  }
);

hideImagesCheckbox.addEventListener("change", () => {
  hideImagesCompleteSub.style.display = hideImagesCheckbox.checked ? "block" : "none";
  if (!hideImagesCheckbox.checked) {
    hideImagesCompleteCheckbox.checked = false;
  }
});

hideAdsCheckbox.addEventListener("change", () => {
  hideAdsCompleteSub.style.display = hideAdsCheckbox.checked ? "block" : "none";
  if (!hideAdsCheckbox.checked) {
    hideAdsCompleteCheckbox.checked = false;
  }
});

imageScaleSlider.addEventListener("input", () => {
  imageScaleValue.textContent = imageScaleSlider.value + "%";
});

fontScaleSlider.addEventListener("input", () => {
  fontScaleValue.textContent = fontScaleSlider.value + "%";
});

saveBtn.onclick = () => {
  const sites = textarea.value
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const ignoreClasses = ignoreClassesTextarea.value
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  chrome.storage.sync.set(
    {
      blockSites: sites,
      ignoreClasses: ignoreClasses,
      hideImages: hideImagesCheckbox.checked,
      hideImagesComplete: hideImagesCompleteCheckbox.checked,
      hideAds: hideAdsCheckbox.checked,
      hideAdsComplete: hideAdsCompleteCheckbox.checked,
      hideFavicon: hideFaviconCheckbox.checked,
      normalizeColor: normalizeColorCheckbox.checked,
      imageScale: parseInt(imageScaleSlider.value),
      fontScale: parseInt(fontScaleSlider.value),
    },
    () => {
      msg.textContent = "✓ Đã lưu!";
      setTimeout(() => {
        msg.textContent = "";
      }, 2000);
    }
  );
};

resetBtn.onclick = () => {
  // Cập nhật UI
  textarea.value = DEFAULTS.blockSites.join("\n");
  ignoreClassesTextarea.value = DEFAULTS.ignoreClasses.join("\n");
  hideImagesCheckbox.checked = DEFAULTS.hideImages;
  hideImagesCompleteCheckbox.checked = DEFAULTS.hideImagesComplete;
  hideAdsCheckbox.checked = DEFAULTS.hideAds;
  hideAdsCompleteCheckbox.checked = DEFAULTS.hideAdsComplete;
  hideFaviconCheckbox.checked = DEFAULTS.hideFavicon;
  normalizeColorCheckbox.checked = DEFAULTS.normalizeColor;
  imageScaleSlider.value = DEFAULTS.imageScale;
  imageScaleValue.textContent = DEFAULTS.imageScale + "%";
  fontScaleSlider.value = DEFAULTS.fontScale;
  fontScaleValue.textContent = DEFAULTS.fontScale + "%";

  hideImagesCompleteSub.style.display = DEFAULTS.hideImages ? "block" : "none";
  hideAdsCompleteSub.style.display = DEFAULTS.hideAds ? "block" : "none";

  // Lưu vào storage
  chrome.storage.sync.set(DEFAULTS, () => {
    msg.textContent = "✓ Đã reset mặc định!";
    setTimeout(() => {
      msg.textContent = "";
    }, 2000);
  });
};
