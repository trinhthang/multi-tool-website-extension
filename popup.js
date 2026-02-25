const textarea = document.getElementById("sites");
const ignoreClassesTextarea = document.getElementById("ignoreClasses");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const toast = document.getElementById("toast");
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
const themeBtns = document.querySelectorAll(".theme-btn");

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
  hideImagesComplete: false,
  hideAds: true,
  hideAdsComplete: true,
  hideFavicon: true,
  normalizeColor: true,
  imageScale: 100,
  fontScale: 100,
  themeMode: "system",
};

// ====== TOAST ======
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ====== RELOAD CURRENT TAB ======
function reloadCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
}

// ====== HÀM CẬP NHẬT UI ======
function applyToUI(data) {
  textarea.value = data.blockSites.join("\n");
  ignoreClassesTextarea.value = data.ignoreClasses.join("\n");
  hideImagesCheckbox.checked = data.hideImages;
  hideImagesCompleteCheckbox.checked = data.hideImagesComplete;
  hideAdsCheckbox.checked = data.hideAds;
  hideAdsCompleteCheckbox.checked = data.hideAdsComplete;
  hideFaviconCheckbox.checked = data.hideFavicon;
  normalizeColorCheckbox.checked = data.normalizeColor;
  imageScaleSlider.value = data.imageScale;
  imageScaleValue.textContent = data.imageScale + "%";
  fontScaleSlider.value = data.fontScale;
  fontScaleValue.textContent = data.fontScale + "%";

  hideImagesCompleteSub.style.display = data.hideImages ? "block" : "none";
  hideAdsCompleteSub.style.display = data.hideAds ? "block" : "none";

  setActiveThemeBtn(data.themeMode || "system");
}

function setActiveThemeBtn(mode) {
  themeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === mode);
  });
}

// ====== LOAD ======
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
    themeMode: "system",
  },
  (data) => {
    const resolved = {
      blockSites: data.blockSites !== null ? data.blockSites : DEFAULT_SITES,
      ignoreClasses: data.ignoreClasses !== null ? data.ignoreClasses : DEFAULT_IGNORE_CLASSES,
      hideImages: data.hideImages !== false,
      hideImagesComplete: data.hideImagesComplete === true,
      hideAds: data.hideAds !== false,
      hideAdsComplete: data.hideAdsComplete === true,
      hideFavicon: data.hideFavicon === true,
      normalizeColor: data.normalizeColor === true,
      imageScale: data.imageScale || 100,
      fontScale: data.fontScale || 100,
      themeMode: data.themeMode || "system",
    };
    applyToUI(resolved);
  }
);

// ====== EVENT LISTENERS ======
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

// ====== THEME BUTTONS ======
themeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.dataset.theme;
    setActiveThemeBtn(mode);
    chrome.storage.sync.set({ themeMode: mode }, () => {
      showToast("✅ Đã đổi chủ đề!");
      reloadCurrentTab();
    });
  });
});

// ====== ÁP DỤNG (LƯU) ======
saveBtn.onclick = () => {
  const sites = textarea.value
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const ignoreClasses = ignoreClassesTextarea.value
    .split("\n")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const activeTheme = document.querySelector(".theme-btn.active");
  const themeMode = activeTheme ? activeTheme.dataset.theme : "system";

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
      themeMode: themeMode,
    },
    () => {
      showToast("✅ Đã áp dụng!");
      reloadCurrentTab();
    }
  );
};

// ====== RESET MẶC ĐỊNH ======
resetBtn.onclick = () => {
  applyToUI(DEFAULTS);

  chrome.storage.sync.set(DEFAULTS, () => {
    showToast("🔄 Đã reset mặc định!");
    reloadCurrentTab();
  });
};
