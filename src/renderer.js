const appNameElement = document.querySelector('[data-app-name]');
const appVersionElement = document.querySelector('[data-app-version]');
const platformElement = document.querySelector('[data-platform]');
const categoryRowElement = document.querySelector('[data-category-row]');
const rowOneWrapElement = document.querySelector('[data-row-one-wrap]');
const rowOneScrollControlsElement = document.querySelector('[data-row-one-scroll-controls]');
const rowOneScrollUpButton = document.querySelector('[data-action="row-one-scroll-up"]');
const rowOneScrollDownButton = document.querySelector('[data-action="row-one-scroll-down"]');
const itemRowElement = document.querySelector('[data-item-row]');
const rowTwoWrapElement = document.querySelector('[data-row-two-wrap]');
const rowTwoScrollControlsElement = document.querySelector('[data-row-two-scroll-controls]');
const rowTwoScrollUpButton = document.querySelector('[data-action="row-two-scroll-up"]');
const rowTwoScrollDownButton = document.querySelector('[data-action="row-two-scroll-down"]');
const manageCategoriesButton = document.querySelector('[data-action="manage-categories"]');
const categoryDialog = document.querySelector('[data-modal="category"]');
const categoryListView = document.querySelector('[data-view="category-list"]');
const categoryManageList = document.querySelector('[data-manage-list]');
const categoryDialogForm = document.querySelector('[data-form="category-dialog"]');
const dialogFormTitle = document.querySelector('[data-dialog-form-title]');
const dialogSubmitButton = document.querySelector('[data-dialog-submit-button]');
const dialogCategoryIconField = document.querySelector('[data-field="dialog-category-icon"]');
const dialogCategoryNameField = document.querySelector('[data-field="dialog-category-name"]');
const closeCategoryDialogButton = document.querySelector('[data-action="close-category-dialog"]');
const itemListView = document.querySelector('[data-view="item-list"]');
const itemListTitle = document.querySelector('[data-item-list-title]');
const itemManageList = document.querySelector('[data-item-manage-list]');
const itemDialogForm = document.querySelector('[data-form="item-dialog"]');
const itemFormTitle = document.querySelector('[data-item-form-title]');
const itemSubmitButton = document.querySelector('[data-item-submit-button]');
const dialogItemIconField = document.querySelector('[data-field="dialog-item-icon"]');
const dialogItemNameField = document.querySelector('[data-field="dialog-item-name"]');
const dialogItemUrlField = document.querySelector('[data-field="dialog-item-url"]');
const directoryNameElement = document.querySelector('[data-directory-name]');
const directoryPathElement = document.querySelector('[data-directory-path]');
const chooseDirectoryButton = document.querySelector('[data-action="choose-directory"]');
const reloadDirectoryButton = document.querySelector('[data-action="reload-directory"]');
const directoryEntriesElement = document.querySelector('[data-directory-entries]');
const previewPathElement = document.querySelector('[data-preview-path]');
const previewContentElement = document.querySelector('[data-preview-content]');
const statusElement = document.querySelector('[data-status]');
const externalUrlInput = document.querySelector('[data-external-url]');
const openExternalButton = document.querySelector('[data-action="open-external"]');
const contentStackElement = document.querySelector('[data-content-stack]');
const webviewPaneElement = document.querySelector('[data-webview-pane]');
const webviewBarElement = document.querySelector('[data-webview-bar]');
const webviewUrlElement = document.querySelector('[data-webview-url]');
const refreshWebviewButton = document.querySelector('[data-action="refresh-webview"]');
const catalogPanelElement = document.querySelector('.catalog-panel');

const CATALOG_STORAGE_KEY = 'custom-electron-browser.catalog.v1';

const EMOJI_LIST = [
  { label: 'Tech & AI', emojis: ['🤖', '💻', '🧠', '🔬', '⚡', '🚀', '🛸', '📱', '💾', '🖥️', '⌨️', '🔌'] },
  { label: 'Communication', emojis: ['💬', '📧', '📞', '🗨️', '📝', '🔔', '📢', '💌', '🤝'] },
  { label: 'Media & Fun', emojis: ['🎵', '🎬', '📷', '🎨', '🎮', '🎭', '🎲', '🎯', '🎪'] },
  { label: 'Work & Finance', emojis: ['💼', '📊', '📈', '💰', '🏦', '🗂️', '📋', '✅', '🔑', '🏢'] },
  { label: 'Tools & Web', emojis: ['🔧', '⚙️', '🛠️', '🔒', '🛡️', '🔍', '🌐', '🔗'] },
  { label: 'Stars & More', emojis: ['⭐', '🌟', '✨', '🔥', '❤️', '🎉', '👑', '🌈', '🦄', '🍕', '☕'] },
];

let activePickerPanel = null;

function buildIconPicker(panel) {
  if (panel.childElementCount > 0) {
    return;
  }
  EMOJI_LIST.forEach(({ label, emojis }) => {
    const heading = document.createElement('p');
    heading.className = 'icon-picker-heading';
    heading.textContent = label;
    panel.append(heading);
    const grid = document.createElement('div');
    grid.className = 'icon-picker-grid';
    emojis.forEach((emoji) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'icon-emoji-btn';
      btn.textContent = emoji;
      btn.dataset.emoji = emoji;
      grid.append(btn);
    });
    panel.append(grid);
  });
}

function openIconPicker(panel) {
  if (activePickerPanel && activePickerPanel !== panel) {
    activePickerPanel.hidden = true;
  }
  buildIconPicker(panel);
  panel.hidden = false;
  activePickerPanel = panel;
}

function closeActiveIconPicker() {
  if (activePickerPanel) {
    activePickerPanel.hidden = true;
    activePickerPanel = null;
  }
}

const state = {
  selectedDirectory: null,
  currentDirectory: null,
  selectedCategoryId: null,
  selectedItemId: null,
  editingCategoryId: null,
  managingCategoryId: null,
  editingItemId: null,
  catalog: []
};

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultCatalog() {
  return [
    {
      id: createId('cat'),
      name: 'AI tools',
      icon: '🤖',
      items: [
        {
          id: createId('item'),
          name: 'ChatGPT',
          icon: '💬',
          url: 'https://chat.openai.com'
        },
        {
          id: createId('item'),
          name: 'Gemini',
          icon: '✨',
          url: 'https://gemini.google.com'
        }
      ]
    }
  ];
}

function normalizeCatalog(rawCatalog) {
  if (!Array.isArray(rawCatalog)) {
    return [];
  }

  return rawCatalog
    .map((category) => {
      const items = Array.isArray(category.items) ? category.items : [];

      return {
        id: typeof category.id === 'string' && category.id ? category.id : createId('cat'),
        name: typeof category.name === 'string' ? category.name.trim() : '',
        icon: typeof category.icon === 'string' ? category.icon.trim() : '',
        items: items
          .map((item) => ({
            id: typeof item.id === 'string' && item.id ? item.id : createId('item'),
            name: typeof item.name === 'string' ? item.name.trim() : '',
            icon: typeof item.icon === 'string' ? item.icon.trim() : '',
            url: typeof item.url === 'string' ? item.url.trim() : ''
          }))
          .filter((item) => item.name && item.icon && item.url)
      };
    })
    .filter((category) => category.name && category.icon);
}

function saveCatalog() {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(state.catalog));
}

function ensureSelectedCategory() {
  const hasSelectedCategory = state.catalog.some((category) => category.id === state.selectedCategoryId);

  if (hasSelectedCategory) {
    return;
  }

  state.selectedCategoryId = state.catalog[0]?.id || null;
}

function loadCatalog() {
  const saved = localStorage.getItem(CATALOG_STORAGE_KEY);

  if (!saved) {
    state.catalog = getDefaultCatalog();
    state.selectedCategoryId = state.catalog[0]?.id || null;
    saveCatalog();
    return;
  }

  try {
    state.catalog = normalizeCatalog(JSON.parse(saved));
  } catch {
    state.catalog = getDefaultCatalog();
  }

  if (state.catalog.length === 0) {
    state.catalog = getDefaultCatalog();
  }

  ensureSelectedCategory();
  saveCatalog();
}

function getSelectedCategory() {
  return state.catalog.find((category) => category.id === state.selectedCategoryId) || null;
}

function setStatus(message, type = 'info') {
  statusElement.textContent = message;
  statusElement.dataset.status = type;
}

function resetPreview() {
  previewPathElement.textContent = 'No file selected';
  previewContentElement.textContent = 'Choose a directory, then select a text file to preview it here.';
}

function renderDirectoryEntries(entries) {
  directoryEntriesElement.replaceChildren();

  if (entries.length === 0) {
    const emptyState = document.createElement('li');
    emptyState.className = 'entry entry-empty';
    emptyState.textContent = 'This directory is empty.';
    directoryEntriesElement.append(emptyState);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    const button = document.createElement('button');

    item.className = 'entry';
    button.className = 'entry-button';
    button.type = 'button';
    button.dataset.kind = entry.kind;
    button.dataset.path = entry.path;
    button.textContent = `${entry.kind === 'directory' ? '[DIR]' : '[FILE]'} ${entry.name}`;

    item.append(button);
    directoryEntriesElement.append(item);
  });
}

async function loadDirectory(directoryPath) {
  const entries = await window.nativeApi.listDirectory(directoryPath);
  state.currentDirectory = directoryPath;
  renderDirectoryEntries(entries);
  reloadDirectoryButton.disabled = false;
  setStatus(`Loaded ${entries.length} items from ${directoryPath}.`);
}

function createChipMainButton(action, dataAttribute, dataValue, iconText, nameText) {
  const mainButton = document.createElement('button');
  const icon = document.createElement('span');
  const name = document.createElement('span');

  mainButton.type = 'button';
  mainButton.className = 'chip-main';
  mainButton.dataset.action = action;
  mainButton.dataset[dataAttribute] = dataValue;

  icon.className = 'chip-icon';
  icon.textContent = iconText;

  name.className = 'chip-name';
  name.textContent = nameText;

  mainButton.append(icon, name);
  return mainButton;
}

function renderCategoryRow() {
  categoryRowElement.replaceChildren();
  rowOneWrapElement.scrollTop = 0;

  if (state.catalog.length === 0) {
    const emptyCategory = document.createElement('li');
    emptyCategory.className = 'chip-empty';
    emptyCategory.textContent = 'No categories yet. Click Manage to add one.';
    categoryRowElement.append(emptyCategory);
    return;
  }

  state.catalog.forEach((category) => {
    const item = document.createElement('li');

    item.className = 'chip';
    if (category.id === state.selectedCategoryId) {
      item.classList.add('is-selected');
    }

    item.append(
      createChipMainButton('select-category', 'categoryId', category.id, category.icon, category.name)
    );

    categoryRowElement.append(item);
  });
}

function renderItemRow() {
  itemRowElement.replaceChildren();
  const selectedCategory = getSelectedCategory();

  if (!selectedCategory) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'chip-empty';
    emptyItem.textContent = 'Select or create a category to show row two items.';
    itemRowElement.append(emptyItem);
    return;
  }

  if (selectedCategory.items.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'chip-empty';
    emptyItem.textContent = `No items in ${selectedCategory.name}.`;
    itemRowElement.append(emptyItem);
    return;
  }

  selectedCategory.items.forEach((itemData) => {
    const item = document.createElement('li');
    item.className = 'chip';
    if (itemData.id === state.selectedItemId) {
      item.classList.add('is-selected');
    }
    item.append(createChipMainButton('open-item', 'itemId', itemData.id, itemData.icon, itemData.name));
    itemRowElement.append(item);
  });
}

function renderCatalogRows() {
  ensureSelectedCategory();
  renderCategoryRow();
  renderItemRow();
  requestAnimationFrame(() => {
    syncRowOneView();
    syncRowTwoView();
  });
}

function getRowOneMetrics() {
  const firstChip = categoryRowElement.querySelector('.chip');

  if (!firstChip) {
    return null;
  }

  const chipHeight = Math.ceil(firstChip.getBoundingClientRect().height);
  const rowStyles = getComputedStyle(categoryRowElement);
  const rowGap = Number.parseFloat(rowStyles.rowGap || rowStyles.gap || '0') || 0;

  return {
    chipHeight,
    rowGap,
    oneRowHeight: chipHeight,
    twoRowsHeight: chipHeight * 2 + rowGap
  };
}

function updateRowOneScrollButtons() {
  const canScrollUp = rowOneWrapElement.scrollTop > 1;
  const canScrollDown =
    rowOneWrapElement.scrollTop + rowOneWrapElement.clientHeight < rowOneWrapElement.scrollHeight - 1;

  rowOneScrollUpButton.disabled = !canScrollUp;
  rowOneScrollDownButton.disabled = !canScrollDown;
}

function syncRowOneView() {
  const metrics = getRowOneMetrics();

  if (!metrics) {
    rowOneWrapElement.style.height = 'auto';
    rowOneScrollControlsElement.hidden = true;
    return;
  }

  const contentHeight = Math.ceil(categoryRowElement.scrollHeight);
  const targetHeight =
    contentHeight <= metrics.oneRowHeight + 1
      ? metrics.oneRowHeight
      : Math.min(contentHeight, metrics.twoRowsHeight);

  rowOneWrapElement.style.height = `${targetHeight}px`;
  const hasOverflow = contentHeight > metrics.twoRowsHeight + 1;
  rowOneScrollControlsElement.hidden = !hasOverflow;

  if (!hasOverflow) {
    rowOneWrapElement.scrollTop = 0;
  }

  updateRowOneScrollButtons();
}

function handleRowOneScroll(direction) {
  const metrics = getRowOneMetrics();

  if (!metrics) {
    return;
  }

  const step = metrics.chipHeight + metrics.rowGap;
  rowOneWrapElement.scrollBy({
    top: direction * step,
    behavior: 'smooth'
  });
}

function getRowTwoMetrics() {
  const firstChip = itemRowElement.querySelector('.chip');

  if (!firstChip) {
    return null;
  }

  const chipHeight = Math.ceil(firstChip.getBoundingClientRect().height);
  const rowStyles = getComputedStyle(itemRowElement);
  const rowGap = Number.parseFloat(rowStyles.rowGap || rowStyles.gap || '0') || 0;

  return {
    chipHeight,
    rowGap,
    oneRowHeight: chipHeight,
    twoRowsHeight: chipHeight * 2 + rowGap
  };
}

function updateRowTwoScrollButtons() {
  const canScrollUp = rowTwoWrapElement.scrollTop > 1;
  const canScrollDown =
    rowTwoWrapElement.scrollTop + rowTwoWrapElement.clientHeight < rowTwoWrapElement.scrollHeight - 1;

  rowTwoScrollUpButton.disabled = !canScrollUp;
  rowTwoScrollDownButton.disabled = !canScrollDown;
}

function syncRowTwoView() {
  const metrics = getRowTwoMetrics();

  if (!metrics) {
    rowTwoWrapElement.style.height = 'auto';
    rowTwoScrollControlsElement.hidden = true;
    return;
  }

  const contentHeight = Math.ceil(itemRowElement.scrollHeight);
  const targetHeight =
    contentHeight <= metrics.oneRowHeight + 1
      ? metrics.oneRowHeight
      : Math.min(contentHeight, metrics.twoRowsHeight);

  rowTwoWrapElement.style.height = `${targetHeight}px`;
  const hasOverflow = contentHeight > metrics.twoRowsHeight + 1;
  rowTwoScrollControlsElement.hidden = !hasOverflow;

  if (!hasOverflow) {
    rowTwoWrapElement.scrollTop = 0;
  }

  updateRowTwoScrollButtons();
}

function handleRowTwoScroll(direction) {
  const metrics = getRowTwoMetrics();

  if (!metrics) {
    return;
  }

  const step = metrics.chipHeight + metrics.rowGap;
  rowTwoWrapElement.scrollBy({
    top: direction * step,
    behavior: 'smooth'
  });
}

function renderCategoryManageList() {
  categoryManageList.replaceChildren();

  if (state.catalog.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'manage-list-empty';
    empty.textContent = 'No categories yet.';
    categoryManageList.append(empty);
    return;
  }

  state.catalog.forEach((category) => {
    const item = document.createElement('li');
    item.className = 'manage-list-item';

    const label = document.createElement('span');
    label.className = 'manage-item-label';
    label.textContent = `${category.icon}\u2002${category.name}`;

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';

    const itemsBtn = document.createElement('button');
    itemsBtn.type = 'button';
    itemsBtn.className = 'button-secondary manage-item-btn';
    itemsBtn.dataset.action = 'manage-items';
    itemsBtn.dataset.categoryId = category.id;
    itemsBtn.textContent = `Items (${category.items.length})`;

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'button-secondary manage-item-btn';
    editBtn.dataset.action = 'edit-category';
    editBtn.dataset.categoryId = category.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'button-secondary manage-item-btn manage-item-btn--delete';
    deleteBtn.dataset.action = 'delete-category';
    deleteBtn.dataset.categoryId = category.id;
    deleteBtn.textContent = 'Delete';

    actions.append(itemsBtn, editBtn, deleteBtn);
    item.append(label, actions);
    categoryManageList.append(item);
  });
}

function renderItemManageList() {
  itemManageList.replaceChildren();
  const category = state.catalog.find((c) => c.id === state.managingCategoryId);

  if (!category) {
    return;
  }

  if (category.items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'manage-list-empty';
    empty.textContent = 'No items yet.';
    itemManageList.append(empty);
    return;
  }

  category.items.forEach((itemData) => {
    const li = document.createElement('li');
    li.className = 'manage-list-item';

    const label = document.createElement('span');
    label.className = 'manage-item-label';
    label.textContent = `${itemData.icon}\u2002${itemData.name}`;

    const sub = document.createElement('span');
    sub.className = 'manage-item-url';
    sub.textContent = itemData.url;

    const labelWrap = document.createElement('div');
    labelWrap.className = 'manage-item-label-wrap';
    labelWrap.append(label, sub);

    const actions = document.createElement('div');
    actions.className = 'manage-item-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'button-secondary manage-item-btn';
    editBtn.dataset.action = 'edit-item';
    editBtn.dataset.itemId = itemData.id;
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'button-secondary manage-item-btn manage-item-btn--delete';
    deleteBtn.dataset.action = 'delete-item';
    deleteBtn.dataset.itemId = itemData.id;
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    li.append(labelWrap, actions);
    itemManageList.append(li);
  });
}

function showCategoryList() {
  closeActiveIconPicker();
  renderCategoryManageList();
  categoryListView.hidden = false;
  categoryDialogForm.hidden = true;
  itemListView.hidden = true;
  itemDialogForm.hidden = true;
}

function showCategoryForm(categoryId = null) {
  closeActiveIconPicker();
  state.editingCategoryId = categoryId;

  if (categoryId) {
    const category = state.catalog.find((c) => c.id === categoryId);
    dialogFormTitle.textContent = 'Edit category';
    dialogSubmitButton.textContent = 'Save';
    dialogCategoryIconField.value = category.icon;
    dialogCategoryNameField.value = category.name;
  } else {
    dialogFormTitle.textContent = 'Add category';
    dialogSubmitButton.textContent = 'Add';
    dialogCategoryIconField.value = '';
    dialogCategoryNameField.value = '';
  }

  categoryListView.hidden = true;
  categoryDialogForm.hidden = false;
  itemListView.hidden = true;
  itemDialogForm.hidden = true;
  dialogCategoryIconField.focus();
}

function showItemList(categoryId) {
  closeActiveIconPicker();
  state.managingCategoryId = categoryId;
  const category = state.catalog.find((c) => c.id === categoryId);
  itemListTitle.textContent = `${category.icon}\u2002${category.name} — Items`;
  renderItemManageList();
  categoryListView.hidden = true;
  categoryDialogForm.hidden = true;
  itemListView.hidden = false;
  itemDialogForm.hidden = true;
}

function showItemForm(itemId = null) {
  closeActiveIconPicker();
  state.editingItemId = itemId;

  if (itemId) {
    const category = state.catalog.find((c) => c.id === state.managingCategoryId);
    const itemData = category.items.find((i) => i.id === itemId);
    itemFormTitle.textContent = 'Edit item';
    itemSubmitButton.textContent = 'Save';
    dialogItemIconField.value = itemData.icon;
    dialogItemNameField.value = itemData.name;
    dialogItemUrlField.value = itemData.url;
  } else {
    itemFormTitle.textContent = 'Add item';
    itemSubmitButton.textContent = 'Add';
    dialogItemIconField.value = '';
    dialogItemNameField.value = '';
    dialogItemUrlField.value = '';
  }

  categoryListView.hidden = true;
  categoryDialogForm.hidden = true;
  itemListView.hidden = true;
  itemDialogForm.hidden = false;
  dialogItemIconField.focus();
}

function openCategoryManager() {
  showCategoryList();
  categoryDialog.showModal();
}

function closeCategoryDialog() {
  closeActiveIconPicker();
  categoryDialog.close();
}

function handleCategoryDialogSubmit(event) {
  event.preventDefault();

  const icon = dialogCategoryIconField.value.trim();
  const name = dialogCategoryNameField.value.trim();

  if (!icon || !name) {
    setStatus('Category icon and name are required.', 'warning');
    return;
  }

  if (state.editingCategoryId) {
    const category = state.catalog.find((c) => c.id === state.editingCategoryId);
    if (category) {
      category.icon = icon;
      category.name = name;
      saveCatalog();
      renderCatalogRows();
      setStatus(`Updated category ${name}.`);
    }
  } else {
    const newCategory = { id: createId('cat'), icon, name, items: [] };
    state.catalog.push(newCategory);
    state.selectedCategoryId = newCategory.id;
    saveCatalog();
    renderCatalogRows();
    setStatus(`Added category ${name}.`);
  }

  showCategoryList();
}

function handleItemDialogSubmit(event) {
  event.preventDefault();

  const icon = dialogItemIconField.value.trim();
  const name = dialogItemNameField.value.trim();
  let url = dialogItemUrlField.value.trim();

  if (url && !/^[a-z][a-z0-9+\-.]*:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  if (!icon || !name || !url) {
    setStatus('Item icon, name, and URL are required.', 'warning');
    return;
  }

  const category = state.catalog.find((c) => c.id === state.managingCategoryId);

  if (!category) {
    return;
  }

  if (state.editingItemId) {
    const itemData = category.items.find((i) => i.id === state.editingItemId);
    if (itemData) {
      itemData.icon = icon;
      itemData.name = name;
      itemData.url = url;
      saveCatalog();
      renderCatalogRows();
      setStatus(`Updated item ${name}.`);
    }
  } else {
    category.items.push({ id: createId('item'), icon, name, url });
    saveCatalog();
    renderCatalogRows();
    setStatus(`Added item ${name}.`);
  }

  showItemList(state.managingCategoryId);
}

async function showAppInfo() {
  const [appInfo, platform] = await Promise.all([
    window.nativeApi.appInfo(),
    window.nativeApi.platform()
  ]);

  appNameElement.textContent = appInfo.name;
  appVersionElement.textContent = appInfo.version;
  platformElement.textContent = platform;
}

function openWebView(url, itemId) {
  webviewPaneElement.style.top = `${catalogPanelElement.getBoundingClientRect().bottom}px`;
  webviewPaneElement.classList.add('is-open');
  contentStackElement.hidden = true;
  webviewUrlElement.textContent = url;
  const barBottom = webviewBarElement.getBoundingClientRect().bottom;
  window.nativeApi.openBrowserPane(url, itemId, barBottom);
}

function closeWebView() {
  window.nativeApi.closeBrowserPane();
  webviewPaneElement.classList.remove('is-open');
  contentStackElement.hidden = false;
  webviewUrlElement.textContent = '';
  state.selectedItemId = null;
  renderItemRow();
  requestAnimationFrame(syncRowTwoView);
}

async function refreshWebView(ignoreCache = false) {
  if (!state.selectedItemId) {
    return;
  }

  const reloaded = await window.nativeApi.reloadBrowserPane(state.selectedItemId, ignoreCache);

  if (reloaded) {
    setStatus(`Reloaded ${webviewUrlElement.textContent}.`);
  }
}

const catalogResizeObserver = new ResizeObserver(() => {
  if (webviewPaneElement.classList.contains('is-open')) {
    webviewPaneElement.style.top = `${catalogPanelElement.getBoundingClientRect().bottom}px`;
    const barBottom = webviewBarElement.getBoundingClientRect().bottom;
    window.nativeApi.resizeBrowserPane(barBottom);
  }
});
catalogResizeObserver.observe(catalogPanelElement);

function handleCategoryRowClick(event) {
  const button = event.target.closest('button[data-action="select-category"]');

  if (!button) {
    return;
  }

  state.selectedCategoryId = button.dataset.categoryId;
  state.selectedItemId = null;
  window.nativeApi.destroyAllBrowserPanes();
  closeWebView();
  renderCatalogRows();
}

function findItemInSelectedCategory(itemId) {
  const selectedCategory = getSelectedCategory();

  if (!selectedCategory) {
    return null;
  }

  return selectedCategory.items.find((item) => item.id === itemId) || null;
}

function handleItemRowClick(event) {
  const button = event.target.closest('button[data-action="open-item"]');

  if (!button) {
    return;
  }

  const item = findItemInSelectedCategory(button.dataset.itemId);

  if (!item) {
    return;
  }

  if (state.selectedItemId === button.dataset.itemId) {
    state.selectedItemId = null;
    closeWebView();
  } else {
    state.selectedItemId = button.dataset.itemId;
    openWebView(item.url, item.id);
    renderItemRow();
    requestAnimationFrame(syncRowTwoView);
  }
}

async function handleChooseDirectory() {
  const selectedDirectory = await window.nativeApi.chooseDirectory();

  if (!selectedDirectory) {
    setStatus('Directory selection was cancelled.');
    return;
  }

  state.selectedDirectory = selectedDirectory.path;
  directoryNameElement.textContent = selectedDirectory.name;
  directoryPathElement.textContent = selectedDirectory.path;
  resetPreview();
  await loadDirectory(selectedDirectory.path);
}

async function handleDirectoryEntrySelection(event) {
  const button = event.target.closest('.entry-button');

  if (!button) {
    return;
  }

  const entryKind = button.dataset.kind;
  const entryPath = button.dataset.path;

  if (entryKind === 'directory') {
    await loadDirectory(entryPath);
    return;
  }

  if (entryKind !== 'file') {
    setStatus('Only files and directories are supported in this demo.', 'warning');
    return;
  }

  const preview = await window.nativeApi.readTextFile(entryPath);
  previewPathElement.textContent = preview.path;
  previewContentElement.textContent = preview.content || '(empty file)';
  setStatus(`Previewed ${preview.path}.`);
}

async function handleOpenExternal() {
  const targetUrl = externalUrlInput.value.trim();

  if (!targetUrl) {
    setStatus('Enter a URL before opening an external link.', 'warning');
    return;
  }

  await window.nativeApi.openExternal(targetUrl);
  setStatus(`Opened ${targetUrl} in the default app.`);
}

manageCategoriesButton.addEventListener('click', () => {
  openCategoryManager();
});

closeCategoryDialogButton.addEventListener('click', () => {
  closeCategoryDialog();
});

categoryDialogForm.addEventListener('submit', (event) => {
  handleCategoryDialogSubmit(event);
});

categoryDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeCategoryDialog();
});

document.querySelector('[data-action="show-add-category-form"]').addEventListener('click', () => {
  showCategoryForm(null);
});

document.querySelector('[data-action="back-to-list"]').addEventListener('click', () => {
  showCategoryList();
});

document.querySelector('[data-action="show-add-item-form"]').addEventListener('click', () => {
  showItemForm(null);
});

document.querySelector('[data-action="back-to-category-list"]').addEventListener('click', () => {
  showCategoryList();
});

document.querySelector('[data-action="back-to-item-list"]').addEventListener('click', () => {
  showItemList(state.managingCategoryId);
});

itemDialogForm.addEventListener('submit', (event) => {
  handleItemDialogSubmit(event);
});

categoryDialog.addEventListener('click', (event) => {
  const pickBtn = event.target.closest('[data-pick-icon-for]');
  if (pickBtn) {
    const fieldName = pickBtn.dataset.pickIconFor;
    const panel = categoryDialog.querySelector(`[data-icon-picker="${fieldName}"]`);
    if (panel) {
      if (panel.hidden) {
        openIconPicker(panel);
      } else {
        closeActiveIconPicker();
      }
    }
    return;
  }

  const emojiBtn = event.target.closest('[data-emoji]');
  if (emojiBtn && activePickerPanel) {
    const fieldName = activePickerPanel.dataset.iconPicker;
    const input = categoryDialog.querySelector(`[data-field="${fieldName}"]`);
    if (input) {
      input.value = emojiBtn.dataset.emoji;
    }
    closeActiveIconPicker();
    return;
  }

  if (activePickerPanel
    && !event.target.closest('.icon-picker-panel')
    && !event.target.closest('[data-pick-icon-for]')) {
    closeActiveIconPicker();
  }
});

categoryManageList.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) {
    return;
  }

  const { action, categoryId } = btn.dataset;

  if (action === 'manage-items') {
    showItemList(categoryId);
  } else if (action === 'edit-category') {
    showCategoryForm(categoryId);
  } else if (action === 'delete-category') {
    const category = state.catalog.find((c) => c.id === categoryId);
    if (!category) {
      return;
    }
    state.catalog = state.catalog.filter((c) => c.id !== categoryId);
    if (state.selectedCategoryId === categoryId) {
      state.selectedCategoryId = state.catalog[0]?.id || null;
    }
    saveCatalog();
    renderCatalogRows();
    renderCategoryManageList();
    setStatus(`Deleted category ${category.name}.`);
  }
});

itemManageList.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-action]');
  if (!btn) {
    return;
  }

  const { action, itemId } = btn.dataset;
  const category = state.catalog.find((c) => c.id === state.managingCategoryId);

  if (!category) {
    return;
  }

  if (action === 'edit-item') {
    showItemForm(itemId);
  } else if (action === 'delete-item') {
    const itemData = category.items.find((i) => i.id === itemId);
    if (!itemData) {
      return;
    }
    category.items = category.items.filter((i) => i.id !== itemId);
    window.nativeApi.destroyBrowserPane(itemId);
    saveCatalog();
    renderCatalogRows();
    renderItemManageList();
    setStatus(`Deleted item ${itemData.name}.`);
  }
});

chooseDirectoryButton.addEventListener('click', () => {
  handleChooseDirectory().catch((error) => {
    setStatus(error.message, 'error');
  });
});

reloadDirectoryButton.addEventListener('click', () => {
  if (!state.currentDirectory) {
    return;
  }

  loadDirectory(state.currentDirectory).catch((error) => {
    setStatus(error.message, 'error');
  });
});

directoryEntriesElement.addEventListener('click', (event) => {
  handleDirectoryEntrySelection(event).catch((error) => {
    setStatus(error.message, 'error');
  });
});

openExternalButton.addEventListener('click', () => {
  handleOpenExternal().catch((error) => {
    setStatus(error.message, 'error');
  });
});

categoryRowElement.addEventListener('click', (event) => {
  handleCategoryRowClick(event);
});

rowOneScrollUpButton.addEventListener('click', () => {
  handleRowOneScroll(-1);
});

rowOneScrollDownButton.addEventListener('click', () => {
  handleRowOneScroll(1);
});

rowOneWrapElement.addEventListener('scroll', () => {
  updateRowOneScrollButtons();
});

rowTwoScrollUpButton.addEventListener('click', () => {
  handleRowTwoScroll(-1);
});

rowTwoScrollDownButton.addEventListener('click', () => {
  handleRowTwoScroll(1);
});

rowTwoWrapElement.addEventListener('scroll', () => {
  updateRowTwoScrollButtons();
});

window.addEventListener('resize', () => {
  syncRowOneView();
  syncRowTwoView();
});

itemRowElement.addEventListener('click', (event) => {
  handleItemRowClick(event);
});

document.querySelector('[data-action="close-webview"]').addEventListener('click', () => {
  closeWebView();
});

refreshWebviewButton.addEventListener('click', () => {
  refreshWebView().catch((error) => {
    setStatus(error.message, 'error');
  });
});

showAppInfo()
  .then(() => {
    loadCatalog();
    renderCatalogRows();
  })
  .then(resetPreview)
  .then(() => setStatus('Ready. Choose a directory to grant scoped file access.'))
  .catch((error) => {
    setStatus(error.message, 'error');
  });
