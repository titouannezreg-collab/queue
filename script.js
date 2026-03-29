// ─── State ────────────────────────────────────────────────────────────────────
let videos  = JSON.parse(localStorage.getItem('yt_videos'))  || [];
let view    = localStorage.getItem('yt_view')   || 'all';
let sortBy  = localStorage.getItem('yt_sort')   || 'newest';
let layout  = localStorage.getItem('yt_layout') || 'grid';
let theme   = localStorage.getItem('yt_theme')  || 'dark';

// ─── DOM ──────────────────────────────────────────────────────────────────────
const videoListEl  = document.getElementById('videoList');
const searchInput  = document.getElementById('searchInput');
const searchClear  = document.getElementById('searchClear');
const gridInfo     = document.getElementById('gridInfo');
const addBtn       = document.getElementById('addBtn');
const urlInput     = document.getElementById('videoUrl');
const toastWrap    = document.getElementById('toastWrap');

// ─── Persist ──────────────────────────────────────────────────────────────────
function save() {
    localStorage.setItem('yt_videos',  JSON.stringify(videos));
    localStorage.setItem('yt_view',    view);
    localStorage.setItem('yt_sort',    sortBy);
    localStorage.setItem('yt_layout',  layout);
    localStorage.setItem('yt_theme',   theme);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme() {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '◑' : '◐';
}

document.getElementById('themeBtn').addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    save();
});

applyTheme();

// ─── Layout ───────────────────────────────────────────────────────────────────
function applyLayout() {
    videoListEl.className = 'video-container layout-' + layout;
    document.querySelectorAll('.layout-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layout === layout);
    });
}

document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        layout = btn.dataset.layout;
        applyLayout();
        save();
    });
});

// ─── Nav ──────────────────────────────────────────────────────────────────────
function updateNav() {
    document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.getElementById('countAll').textContent       = videos.length;
    document.getElementById('countUnwatched').textContent = videos.filter(v => !v.watched).length;
    document.getElementById('countWatched').textContent   = videos.filter(v => v.watched).length;
    document.getElementById('countPinned').textContent    = videos.filter(v => v.pinned).length;
}

document.querySelectorAll('.nav-item, .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        view = btn.dataset.view;
        updateNav();
        renderVideos();
        save();
    });
});

// ─── Sort ─────────────────────────────────────────────────────────────────────
function applySort() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortBy);
    });
}

document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        sortBy = btn.dataset.sort;
        applySort();
        renderVideos();
        save();
    });
});

// ─── Search ───────────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    searchClear.classList.toggle('visible', q.length > 0);
    renderVideos();
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    renderVideos();
    searchInput.focus();
});

// ─── Filter + Sort ────────────────────────────────────────────────────────────
function getFiltered() {
    const q = searchInput.value.trim().toLowerCase();
    let list = [...videos];

    if (view === 'watched')   list = list.filter(v => v.watched);
    if (view === 'unwatched') list = list.filter(v => !v.watched);
    if (view === 'pinned')    list = list.filter(v => v.pinned);
    if (q) list = list.filter(v => v.title.toLowerCase().includes(q) || (v.channel || '').toLowerCase().includes(q));

    if (sortBy === 'oldest') list.sort((a, b) => a.addedAt - b.addedAt);
    else if (sortBy === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    else list.sort((a, b) => b.addedAt - a.addedAt);

    // Pinned always first (except in pinned view, redundant)
    if (view !== 'pinned') {
        list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    }

    return list;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderVideos() {
    videoListEl.innerHTML = '';
    updateNav();

    const list = getFiltered();
    const total = list.length;

    if (total === 0) {
        const isEmpty = videos.length === 0;
        videoListEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${isEmpty ? '▷' : '◎'}</div>
                <p>${isEmpty ? 'Aucune vidéo sauvegardée' : 'Aucun résultat'}</p>
            </div>`;
        gridInfo.textContent = '';
        return;
    }

    gridInfo.textContent = total + ' vidéo' + (total !== 1 ? 's' : '');

    list.forEach((video, i) => {
        const card = buildCard(video, i);
        videoListEl.appendChild(card);
    });
}

function buildCard(video, index) {
    const card = document.createElement('div');
    card.dataset.id = video.id;
    card.className = 'video-card' +
        (video.watched ? ' is-watched' : '') +
        (video.pinned  ? ' is-pinned'  : '');
    card.style.animationDelay = Math.min(index * 30, 300) + 'ms';

    const date = new Date(video.addedAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric'
    });

    card.innerHTML = `
        ${video.pinned ? '<div class="pin-badge">📌</div>' : ''}
        <a class="card-link" href="${escHtml(video.url)}" target="_blank" rel="noopener">
            <div class="card-thumb">
                <img src="${escHtml(video.thumbnail)}" alt="${escHtml(video.title)}"
                     onerror="this.style.opacity=0" loading="lazy">
                <div class="card-play"><div class="card-play-inner">▶</div></div>
            </div>
        </a>
        <div class="card-body">
            <a class="card-link" href="${escHtml(video.url)}" target="_blank" rel="noopener">
                <div class="card-title">${escHtml(video.title)}</div>
            </a>
            <div class="card-meta">${video.channel ? escHtml(video.channel) + " · " : ""}Ajoutée le ${date}</div>
        </div>
        <div class="card-actions">
            <button class="action-btn pin-btn ${video.pinned ? 'is-active' : ''}" title="${video.pinned ? 'Désépingler' : 'Épingler'}">📌</button>
            <button class="action-btn watch-btn ${video.watched ? 'is-active' : ''}" title="${video.watched ? 'Marquer non vue' : 'Marquer vue'}">✓</button>
            <button class="action-btn delete-btn" title="Supprimer">✕</button>
        </div>
    `;

    card.querySelector('.pin-btn').addEventListener('click', e => {
        e.preventDefault();
        const v = videos.find(x => x.id === video.id);
        v.pinned = !v.pinned;
        save(); renderVideos();
    });

    card.querySelector('.watch-btn').addEventListener('click', e => {
        e.preventDefault();
        const v = videos.find(x => x.id === video.id);
        v.watched = !v.watched;
        save(); renderVideos();
    });

    card.querySelector('.delete-btn').addEventListener('click', e => {
        e.preventDefault();
        const actions = card.querySelector('.card-actions');
        actions.innerHTML = `
            <div class="confirm-wrap">
                <span class="confirm-label">Supprimer ?</span>
                <button class="action-btn confirm-yes">Oui</button>
                <button class="action-btn confirm-no">Non</button>
            </div>`;
        actions.style.opacity = '1';
        actions.style.transform = 'translateY(0)';

        actions.querySelector('.confirm-yes').addEventListener('click', () => {
            videos = videos.filter(v => v.id !== video.id);
            save(); renderVideos();
            toast('Vidéo supprimée', 'warn');
        });
        actions.querySelector('.confirm-no').addEventListener('click', () => renderVideos());
    });

    return card;
}

// ─── Add video ────────────────────────────────────────────────────────────────
async function addVideo() {
    const url = urlInput.value.trim();
    if (!url) return;

    const videoId = getYouTubeID(url);
    if (!videoId) { toast('URL YouTube invalide', 'error'); return; }
    if (videos.some(v => v.id === videoId)) { toast('Déjà dans ta liste', 'warn'); return; }

    addBtn.disabled = true;
    addBtn.querySelector('.btn-label').hidden = true;
    addBtn.querySelector('.btn-loader').hidden = false;

    try {
        const res  = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!res.ok) throw new Error('oembed failed');
        const data = await res.json();

        videos.push({
            id:        videoId,
            url:       `https://www.youtube.com/watch?v=${videoId}`,
            title:     data.title,
            channel:   data.author_name || '',
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            addedAt:   Date.now(),
            watched:   false,
            pinned:    false,
        });

        save();
        renderVideos();
        urlInput.value = '';
        toast('Vidéo ajoutée ✓', 'ok');
    } catch {
        toast('Impossible de récupérer la vidéo', 'error');
    } finally {
        addBtn.disabled = false;
        addBtn.querySelector('.btn-label').hidden = false;
        addBtn.querySelector('.btn-loader').hidden = true;
    }
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportVideos() {
    const blob = new Blob([JSON.stringify(videos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'queue-backup.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Export téléchargé', 'ok');
}

// ─── Import ───────────────────────────────────────────────────────────────────
function importVideos() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const imported = JSON.parse(e.target.result);
                if (!Array.isArray(imported)) throw new Error();
                let added = 0;
                imported.forEach(v => {
                    if (!videos.some(x => x.id === v.id)) { videos.push(v); added++; }
                });
                save(); renderVideos();
                toast(`${added} vidéo${added !== 1 ? 's' : ''} importée${added !== 1 ? 's' : ''}`, 'ok');
            } catch {
                toast('Fichier invalide', 'error');
            }
        };
        reader.readAsText(file);
    });
    input.click();
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastWrap.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => {
        el.classList.remove('show');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, 2600);
}

// ─── YouTube ID ───────────────────────────────────────────────────────────────
function getYouTubeID(url) {
    const regex = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const m = url.match(regex);
    return m ? m[1] : null;
}

// ─── Escape HTML ──────────────────────────────────────────────────────────────
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Sidebar collapse ─────────────────────────────────────────────────────────
let sidebarCollapsed = localStorage.getItem('yt_sidebar') === 'collapsed';

function applySidebar() {
    document.body.classList.toggle('sidebar-collapsed', sidebarCollapsed);
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem('yt_sidebar', sidebarCollapsed ? 'collapsed' : 'open');
    applySidebar();
});

applySidebar();

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addVideo(); });

document.addEventListener('keydown', e => {
    // / → focus search
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== urlInput) {
        e.preventDefault();
        searchInput.focus();
    }
    // Escape → blur
    if (e.key === 'Escape') document.activeElement?.blur();
});

// ─── Events ───────────────────────────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', exportVideos);
document.getElementById('importBtn').addEventListener('click', importVideos);

// ─── Init ─────────────────────────────────────────────────────────────────────
applyLayout();
applySort();
renderVideos();
