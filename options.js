const textarea = document.getElementById('sites');
const ignoreClassesTextarea = document.getElementById('ignoreClasses');
const saveBtn = document.getElementById('saveBtn');
const msg = document.getElementById('msg');
const hideImagesCheckbox = document.getElementById('hideImages');
const hideImagesCompleteCheckbox = document.getElementById('hideImagesComplete');
const hideImagesCompleteSub = document.getElementById('hideImagesCompleteSub');
const hideAdsCheckbox = document.getElementById('hideAds');
const hideAdsCompleteCheckbox = document.getElementById('hideAdsComplete');
const hideAdsCompleteSub = document.getElementById('hideAdsCompleteSub');
const hideFaviconCheckbox = document.getElementById('hideFavicon');
const normalizeColorCheckbox = document.getElementById('normalizeColor');

chrome.storage.sync.get({
  blockSites: [], 
  ignoreClasses: [],
  hideImages: true,
  hideImagesComplete: false,
  hideAds: true,
  hideAdsComplete: false,
  hideFavicon: false,
  normalizeColor: false
}, (data) => {
  textarea.value = (data.blockSites || []).join('\n');
  ignoreClassesTextarea.value = (data.ignoreClasses || []).join('\n');
  hideImagesCheckbox.checked = data.hideImages !== false;
  hideImagesCompleteCheckbox.checked = data.hideImagesComplete === true;
  hideAdsCheckbox.checked = data.hideAds !== false;
  hideAdsCompleteCheckbox.checked = data.hideAdsComplete === true;
  hideFaviconCheckbox.checked = data.hideFavicon === true;
  normalizeColorCheckbox.checked = data.normalizeColor === true;
  
  hideImagesCompleteSub.style.display = hideImagesCheckbox.checked ? 'block' : 'none';
  hideAdsCompleteSub.style.display = hideAdsCheckbox.checked ? 'block' : 'none';
});

hideImagesCheckbox.addEventListener('change', () => {
  hideImagesCompleteSub.style.display = hideImagesCheckbox.checked ? 'block' : 'none';
  if (!hideImagesCheckbox.checked) {
    hideImagesCompleteCheckbox.checked = false;
  }
});

hideAdsCheckbox.addEventListener('change', () => {
  hideAdsCompleteSub.style.display = hideAdsCheckbox.checked ? 'block' : 'none';
  if (!hideAdsCheckbox.checked) {
    hideAdsCompleteCheckbox.checked = false;
  }
});

saveBtn.onclick = () => {
  const sites = textarea.value
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length > 0);
  
  const ignoreClasses = ignoreClassesTextarea.value
    .split('\n')
    .map(x => x.trim())
    .filter(x => x.length > 0);
  
  chrome.storage.sync.set({
    blockSites: sites,
    ignoreClasses: ignoreClasses,
    hideImages: hideImagesCheckbox.checked,
    hideImagesComplete: hideImagesCompleteCheckbox.checked,
    hideAds: hideAdsCheckbox.checked,
    hideAdsComplete: hideAdsCompleteCheckbox.checked,
    hideFavicon: hideFaviconCheckbox.checked,
    normalizeColor: normalizeColorCheckbox.checked
  }, () => {
    msg.textContent = 'Đã lưu!';
    setTimeout(() => { msg.textContent = ''; }, 2000);
  });
};
