/* ============================================
   ARABIA INFORM — Content Editor (Admin CMS)
   No backend required. Uses GitHub API directly.
   ============================================ */

// ─── Configuration ───
const CONFIG = {
    owner: 'Ekson-media',
    repo: 'arabia-inform-live',
    branch: 'main',
    // SHA-256 hash of the admin password
    // To change, run in console: crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPassword')).then(b=>console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))
    passwordHash: '90230ee1405515aa19246cbc88f1754a49ac5a3bb2968dfe00778ea452bdc229',
    // Pre-configured access key (obfuscated)
    _tk: 'Vnd3Y1AxVUNUNkY3bm9ROW1IV0hQbk9YY05DZFJESGdTT0V1X3BoZw==',
    pages: {
        en: [
            { title: 'Home Page', file: 'index.html', icon: '🏠' },
            { title: 'About Us', file: 'about.html', icon: '🏛️' },
            { title: 'The Archive', file: 'archive.html', icon: '📚' },
            { title: 'Solutions', file: 'solutions.html', icon: '🎯' },
            { title: 'Products & Services', file: 'products.html', icon: '⚙️' },
            { title: 'Impact & Numbers', file: 'impact.html', icon: '📊' },
            { title: 'Insights', file: 'insights.html', icon: '💡' },
            { title: 'Partners', file: 'partners.html', icon: '🤝' },
            { title: 'Contact / Demo', file: 'contact.html', icon: '✉️' },
        ],
        ar: [
            { title: 'الصفحة الرئيسية', file: 'ar/index.html', icon: '🏠' },
            { title: 'من نحن', file: 'ar/about.html', icon: '🏛️' },
            { title: 'الأرشيف', file: 'ar/archive.html', icon: '📚' },
            { title: 'الحلول', file: 'ar/solutions.html', icon: '🎯' },
            { title: 'المنتجات والخدمات', file: 'ar/products.html', icon: '⚙️' },
            { title: 'الأثر والأرقام', file: 'ar/impact.html', icon: '📊' },
            { title: 'رؤى وتحليلات', file: 'ar/insights.html', icon: '💡' },
            { title: 'الشركاء', file: 'ar/partners.html', icon: '🤝' },
            { title: 'تواصل معنا', file: 'ar/contact.html', icon: '✉️' },
        ]
    }
};

// ─── State ───
let state = {
    token: null,
    currentPage: null,
    currentPageContent: null,
    currentPageSha: null,
    changes: 0,
    originalHTML: null,
    currentLang: 'en',
    pendingImageData: null,
    pendingImageTarget: null,
};

// ═══════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════

function _decodeTk() {
    try { return atob(CONFIG._tk).split('').reverse().join(''); } catch { return null; }
}

async function hashPassword(password) {
    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

async function handleLogin() {
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    const errorEl = document.getElementById('loginError');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');

    if (!password) {
        errorEl.textContent = 'Please enter the password.';
        errorEl.style.display = 'block';
        return;
    }

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    errorEl.style.display = 'none';

    // Check password
    const hash = await hashPassword(password);

    // Check stored hash or config hash
    const storedHash = localStorage.getItem('ai_admin_pw_hash') || CONFIG.passwordHash;
    if (hash !== storedHash) {
        errorEl.textContent = 'Incorrect password. Please try again.';
        errorEl.style.display = 'block';
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        return;
    }

    // Use pre-configured token or stored token
    const storedToken = localStorage.getItem('ai_admin_token') || _decodeTk();
    if (storedToken) {
        state.token = storedToken;
        localStorage.setItem('ai_admin_token', storedToken);
        const valid = await validateToken();
        if (valid) {
            showDashboard();
        } else {
            showToast('GitHub connection failed. Please check your internet.', 'error');
        }
    } else {
        showSetupSection();
    }

    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
}

function showSetupSection() {
    document.getElementById('setupSection').style.display = 'block';
}

async function saveSetup() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();

    if (!token) {
        showToast('Please enter a valid GitHub token.', 'error');
        return;
    }

    state.token = token;
    const valid = await validateToken();
    if (valid) {
        localStorage.setItem('ai_admin_token', token);
        showToast('Configuration saved!', 'success');
        showDashboard();
    } else {
        showToast('Invalid token. Make sure it has repo access.', 'error');
        state.token = null;
    }
}

async function validateToken() {
    try {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}`, {
            headers: { 'Authorization': `token ${state.token}` }
        });
        return res.ok;
    } catch {
        return false;
    }
}

function handleLogout() {
    state.token = null;
    state.currentPage = null;
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPassword').value = '';
}

// Add enter key support for login
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Auto-login if session exists
    const storedToken = localStorage.getItem('ai_admin_token') || _decodeTk();
    const storedHash = localStorage.getItem('ai_admin_pw_hash') || CONFIG.passwordHash;
    if (storedToken && storedHash) {
        state.token = storedToken;
        validateToken().then(valid => {
            if (valid) {
                showDashboard();
            }
        });
    }
});

// ═══════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    renderPageGrid();
}

function filterPages(lang) {
    state.currentLang = lang;
    document.querySelectorAll('.page-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.page-tab[data-lang="${lang}"]`).classList.add('active');
    renderPageGrid();
}

function renderPageGrid() {
    const grid = document.getElementById('pageGrid');
    const pages = CONFIG.pages[state.currentLang];

    grid.innerHTML = pages.map((page, idx) => `
    <div class="page-card" onclick="openEditor('${page.file}')" style="animation-delay:${idx * 0.05}s">
      <div class="page-card-icon">${page.icon}</div>
      <div class="page-card-title">${page.title}</div>
      <div class="page-card-path">${page.file}</div>
      <div class="page-card-arrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
//  PAGE EDITOR
// ═══════════════════════════════════════════

async function openEditor(filePath) {
    state.currentPage = filePath;
    state.changes = 0;

    document.getElementById('pageListView').style.display = 'none';
    document.getElementById('editorView').style.display = 'flex';
    document.getElementById('editorPageName').textContent = filePath;
    updateChangeUI();

    showLoading('Loading page...');

    try {
        // 1. Fetch raw HTML from GitHub API (for saving later)
        const res = await fetch(
            `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${filePath}?ref=${CONFIG.branch}`,
            { headers: { 'Authorization': `token ${state.token}` } }
        );

        if (!res.ok) throw new Error('Failed to fetch page');

        const data = await res.json();
        state.currentPageSha = data.sha;

        const content = decodeBase64(data.content);
        state.originalHTML = content;
        state.currentPageContent = content;

        // 2. Load the LIVE page URL in the iframe (renders perfectly)
        const iframe = document.getElementById('editorFrame');
        const origin = window.location.origin;
        const sitePath = window.location.pathname.replace(/\/admin\/.*$/, '/');
        const liveUrl = `${origin}${sitePath}${filePath}`;

        // Remove sandbox so the page loads and renders fully
        iframe.removeAttribute('sandbox');

        iframe.onload = () => {
            setTimeout(() => {
                injectEditingCapabilities(iframe);
                hideLoading();
            }, 800);
        };

        iframe.src = liveUrl;

    } catch (err) {
        hideLoading();
        showToast('Failed to load page: ' + err.message, 'error');
        closeEditor();
    }
}

function decodeBase64(encoded) {
    // GitHub returns content with newlines in the base64
    const cleaned = encoded.replace(/\n/g, '');
    const bytes = atob(cleaned);
    // Handle UTF-8 properly
    const uint8Array = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
        uint8Array[i] = bytes.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(uint8Array);
}

function encodeBase64(str) {
    const uint8Array = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function closeEditor() {
    document.getElementById('editorView').style.display = 'none';
    document.getElementById('pageListView').style.display = 'block';
    state.currentPage = null;
    state.currentPageContent = null;
    state.currentPageSha = null;
    state.changes = 0;

    const iframe = document.getElementById('editorFrame');
    iframe.src = 'about:blank';
}

// ═══════════════════════════════════════════
//  INLINE EDITING
// ═══════════════════════════════════════════

function injectEditingCapabilities(iframe) {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;

    // Inject editing styles
    const style = doc.createElement('style');
    style.textContent = `
    /* Editable element hover/focus */
    [data-ai-editable]:hover {
      outline: 2px dashed rgba(215, 190, 130, 0.6) !important;
      outline-offset: 4px !important;
      cursor: text !important;
      position: relative !important;
    }
    [data-ai-editable]:focus {
      outline: 2px solid #D7BE82 !important;
      outline-offset: 4px !important;
      background: rgba(215, 190, 130, 0.05) !important;
    }
    [data-ai-editable].edited {
      outline: 2px solid #10B981 !important;
      outline-offset: 4px !important;
    }
    /* Image hover overlay */
    [data-ai-img] {
      position: relative !important;
      cursor: pointer !important;
    }
    [data-ai-img]:hover {
      filter: brightness(0.85) !important;
    }
    .ai-img-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 30, 53, 0.6);
      color: white;
      font-family: Inter, system-ui, sans-serif;
      font-size: 14px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      border-radius: inherit;
      z-index: 100;
    }
    [data-ai-img]:hover .ai-img-overlay {
      opacity: 1;
    }
    /* Prevent links from navigating */
    a { pointer-events: auto !important; }
    body { cursor: default; }
    /* Don't override the image overlay which should start hidden */
    .ai-img-overlay {
      opacity: 0 !important;
      transition: opacity 0.2s !important;
    }
    [data-ai-img]:hover .ai-img-overlay {
      opacity: 1 !important;
    }
  `;
    doc.head.appendChild(style);

    // Mark text elements as editable
    const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span.section-label, span.counter-label, span.stat-lbl, span.hero-title-line2, span.blog-category, div.hero-badge, li, blockquote, .quote-text, .quote-author, .footer-brand-line';
    const textElements = doc.querySelectorAll(textSelectors);

    textElements.forEach(el => {
        // Skip elements that are just wrappers, icons, or very short
        if (el.children.length > 3 && el.tagName !== 'LI') return;
        if (el.closest('script, style, nav, .nav-menu, .nav-actions, .header-wrapper')) return;
        if (el.classList.contains('stat-val') || el.classList.contains('counter-number') || el.classList.contains('impact-number')) return;

        // Get only direct text content
        const directText = getDirectTextContent(el);
        if (directText.trim().length < 2) return;

        el.setAttribute('data-ai-editable', 'true');
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
        el.dataset.originalText = el.innerHTML;

        // Track changes
        el.addEventListener('input', () => {
            if (el.innerHTML !== el.dataset.originalText) {
                el.classList.add('edited');
                recountChanges(doc);
            } else {
                el.classList.remove('edited');
                recountChanges(doc);
            }
        });

        // Prevent enter from creating new blocks
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                el.blur();
            }
        });
    });

    // Mark images as clickable
    const images = doc.querySelectorAll('img');
    images.forEach(img => {
        // Skip tiny icons, logos, SVGs
        if (img.closest('.nav-brand, .footer-brand, header')) return;
        if (img.naturalWidth < 50 || img.src.includes('logo')) return;

        const wrapper = img.parentElement;
        img.setAttribute('data-ai-img', 'true');
        img.dataset.originalSrc = img.getAttribute('src');

        // Create overlay
        const overlay = doc.createElement('div');
        overlay.className = 'ai-img-overlay';
        overlay.innerHTML = '📷 Click to replace image';

        // We need to make the parent relative for the overlay
        if (wrapper) {
            wrapper.style.position = 'relative';
            wrapper.style.overflow = 'hidden';
            wrapper.appendChild(overlay);
        }

        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openImageModal(img);
        });

        // Also make overlay clickable
        overlay.style.pointerEvents = 'auto';
        overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openImageModal(img);
        });
    });

    // Add a feature to delete elements (text blocks or image wrappers)
    doc.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || (e.key === 'Backspace' && e.shiftKey)) {
            const activeEl = doc.activeElement;
            const isText = activeEl && activeEl.hasAttribute('data-ai-editable');
            const isImage = activeEl && (activeEl.tagName === 'IMG' || activeEl.querySelector('img'));

            // Delete text element if selected or empty
            if (isText) {
                activeEl.remove();
                state.changes++;
                updateChangeUI();
                e.preventDefault();
            }
        }
    });

    // Prevent all link navigation
    doc.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && !e.target.hasAttribute('data-ai-editable')) {
            e.preventDefault();
        }
    });
}

function getDirectTextContent(el) {
    let text = '';
    for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        }
    }
    return text;
}

function recountChanges(doc) {
    const edited = doc.querySelectorAll('.edited');
    const imgEdited = doc.querySelectorAll('[data-ai-img-changed]');
    state.changes = edited.length + imgEdited.length;
    updateChangeUI();
}

function updateChangeUI() {
    const counter = document.getElementById('changeCounter');
    const btnUndo = document.getElementById('btnUndo');
    const btnSave = document.getElementById('btnSave');

    if (state.changes > 0) {
        counter.textContent = `${state.changes} change${state.changes > 1 ? 's' : ''}`;
        counter.style.display = 'inline-block';
        btnUndo.style.display = 'flex';
        btnSave.disabled = false;
    } else {
        counter.style.display = 'none';
        btnUndo.style.display = 'none';
        btnSave.disabled = true;
    }
}

// ═══════════════════════════════════════════
//  IMAGE HANDLING
// ═══════════════════════════════════════════

function openImageModal(imgEl) {
    state.pendingImageTarget = imgEl;
    state.pendingImageData = null;

    const modal = document.getElementById('imageModal');
    const preview = document.getElementById('modalPreview');
    const confirmBtn = document.getElementById('btnConfirmImage');

    preview.src = imgEl.src;
    confirmBtn.disabled = true;
    modal.style.display = 'flex';

    // Setup file input
    const fileInput = document.getElementById('imageInput');
    fileInput.value = '';

    const dropZone = document.getElementById('dropZone');

    // Click to browse
    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        if (e.target.files[0]) handleImageFile(e.target.files[0]);
    };

    // Drag and drop
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); };
    dropZone.ondragleave = () => dropZone.classList.remove('drag-over');
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    };
}

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast('Image is too large. Maximum size is 10MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('modalPreview');
        preview.src = e.target.result;
        state.pendingImageData = {
            dataUrl: e.target.result,
            file: file,
            name: file.name,
            type: file.type
        };
        document.getElementById('btnConfirmImage').disabled = false;
    };
    reader.readAsDataURL(file);
}

function confirmImageReplace() {
    if (!state.pendingImageTarget || !state.pendingImageData) return;

    const img = state.pendingImageTarget;
    const iframe = document.getElementById('editorFrame');
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // Update the image in the iframe
    img.src = state.pendingImageData.dataUrl;
    img.setAttribute('data-ai-img-changed', 'true');
    img.dataset.newImageData = state.pendingImageData.dataUrl;
    img.dataset.newImageName = state.pendingImageData.name;
    img.dataset.newImageType = state.pendingImageData.type;

    recountChanges(doc);
    closeImageModal();
    showToast('Image updated. Click "Publish Changes" to save.', 'info');
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
    state.pendingImageTarget = null;
    state.pendingImageData = null;
}

// ═══════════════════════════════════════════
//  SAVE / PUBLISH
// ═══════════════════════════════════════════

async function saveChanges() {
    if (state.changes === 0) return;

    showLoading('Publishing changes to website...');

    try {
        const iframe = document.getElementById('editorFrame');
        const doc = iframe.contentDocument || iframe.contentWindow.document;

        // 1. Upload any new images first
        const changedImages = doc.querySelectorAll('[data-ai-img-changed]');
        const imageMap = new Map(); // old src -> new src in repo

        for (const img of changedImages) {
            const originalSrc = img.dataset.originalSrc;
            const dataUrl = img.dataset.newImageData;

            if (!dataUrl) continue;

            // Extract base64 data
            const base64Data = dataUrl.split(',')[1];
            const ext = img.dataset.newImageType.split('/')[1] || 'png';
            const timestamp = Date.now();
            const imageName = `images/uploaded_${timestamp}.${ext}`;

            document.getElementById('loadingText').textContent = `Uploading image: ${imageName}...`;

            // Upload image to GitHub
            await githubCreateOrUpdateFile(imageName, base64Data, `Upload image: ${imageName}`);

            // Map the original src to the new path
            imageMap.set(originalSrc, imageName);
        }

        // 2. Build the updated HTML
        document.getElementById('loadingText').textContent = 'Saving page content...';

        // Start with the original HTML and apply text changes
        let updatedHTML = state.originalHTML;

        // Apply text changes
        const editedElements = doc.querySelectorAll('[data-ai-editable].edited');
        for (const el of editedElements) {
            const originalText = el.dataset.originalText;
            const newText = el.innerHTML;

            if (originalText && newText && originalText !== newText) {
                // Clean up contenteditable artifacts from the new text
                let cleanNew = cleanEditableHTML(newText);
                let cleanOriginal = originalText;

                // Replace in the source HTML
                updatedHTML = updatedHTML.replace(cleanOriginal, cleanNew);
            }
        }

        // Apply image src changes
        for (const [oldSrc, newPath] of imageMap) {
            // Figure out the correct relative path for this page
            const isAr = state.currentPage.startsWith('ar/');
            let relativePath;
            if (isAr) {
                relativePath = `../${newPath}`;
            } else {
                relativePath = newPath;
            }

            // Also handle the original src which might have ../ prefix
            updatedHTML = updatedHTML.replace(new RegExp(escapeRegExp(oldSrc), 'g'), relativePath);
        }

        // 3. Commit the updated HTML to GitHub
        document.getElementById('loadingText').textContent = 'Preparing to publish...';

        const encodedContent = encodeBase64(updatedHTML);
        await githubCreateOrUpdateFile(
            state.currentPage,
            encodedContent,
            `Update content: ${state.currentPage}`
        );

        hideLoading();
        showToast('✅ Changes published successfully! The website will update shortly.', 'success');

        // Reset state
        state.originalHTML = updatedHTML;
        state.changes = 0;
        updateChangeUI();

        // Clear edit markers in iframe
        const editedEls = doc.querySelectorAll('.edited');
        editedEls.forEach(el => {
            el.classList.remove('edited');
            el.dataset.originalText = el.innerHTML;
        });
        const changedImgs = doc.querySelectorAll('[data-ai-img-changed]');
        changedImgs.forEach(img => {
            img.removeAttribute('data-ai-img-changed');
            img.dataset.originalSrc = img.getAttribute('src');
        });

    } catch (err) {
        hideLoading();
        showToast('❌ Failed to publish: ' + err.message, 'error');
        console.error('Save error:', err);
    }
}

function cleanEditableHTML(html) {
    // Remove any contenteditable artifacts
    let clean = html;
    // Remove dangling <br> that browsers add
    clean = clean.replace(/<br\s*\/?>\s*$/i, '');
    // Remove zero-width spaces
    clean = clean.replace(/\u200B/g, '');
    return clean;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function undoChanges() {
    if (!state.currentPage) return;

    // Reload the live page in the iframe
    const iframe = document.getElementById('editorFrame');
    const origin = window.location.origin;
    const sitePath = window.location.pathname.replace(/\/admin\/.*$/, '/');
    const liveUrl = `${origin}${sitePath}${state.currentPage}`;

    iframe.onload = () => {
        setTimeout(() => {
            injectEditingCapabilities(iframe);
            state.changes = 0;
            updateChangeUI();
            showToast('All changes undone.', 'info');
        }, 800);
    };

    iframe.src = liveUrl;
}

// ═══════════════════════════════════════════
//  GITHUB API
// ═══════════════════════════════════════════

async function githubCreateOrUpdateFile(path, base64Content, message, sha = null) {
    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`;

    const body = {
        message: message,
        content: base64Content,
        branch: CONFIG.branch
    };

    // ALWAYS fetch the latest SHA right before saving to prevent mismatch errors
    try {
        const timestamp = new Date().getTime();
        const existing = await fetch(`${url}?ref=${CONFIG.branch}&t=${timestamp}`, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (existing.ok) {
            const data = await existing.json();
            body.sha = data.sha;
        }
    } catch { /* File doesn't exist yet, that's fine */ }

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `GitHub API error: ${res.status}`);
    }

    return await res.json();
}

// ═══════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    toast.className = `toast toast-${type}`;
    msgEl.textContent = message;
    iconEl.textContent = icons[type] || 'ℹ️';

    toast.style.display = 'flex';
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 4000);
}

function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    document.getElementById('loadingText').textContent = text;
    overlay.style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}
