(function () {
    const vscode = acquireVsCodeApi();
    const audio = new Audio();

    // --- State ---
    let results = [];
    let currentIndex = -1;
    let isPlaying = false;

    // --- DOM helpers ---
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    // --- Screen navigation ---
    function showScreen(name) {
        $$('.screen').forEach((s) => s.classList.remove('active'));
        const el = $(`#screen-${name}`);
        if (el) { el.classList.add('active'); }
    }

    // --- Utility ---
    function formatDuration(sec) {
        if (!sec || sec < 0) { return '0:00'; }
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text || '';
        return d.innerHTML;
    }

    // --- Skeleton generators ---
    function showResultsSkeleton() {
        const container = $('#results-container');
        container.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'result-item skeleton-item';
            el.innerHTML = `
                <div class="skeleton skeleton-thumbnail"></div>
                <div class="skeleton-info">
                    <div class="skeleton skeleton-line long"></div>
                    <div class="skeleton skeleton-line short"></div>
                </div>`;
            container.appendChild(el);
        }
    }

    function showPlayerSkeleton() {
        const container = $('#player-container');
        container.innerHTML = `
            <div class="player-skeleton">
                <div class="skeleton player-art-skeleton"></div>
                <div class="skeleton skeleton-line medium" style="width:65%;height:14px;margin-top:4px"></div>
                <div class="skeleton skeleton-line short" style="width:40%;height:10px;margin-top:8px"></div>
                <div class="skeleton skeleton-line long" style="width:90%;height:4px;margin-top:22px"></div>
                <div class="player-controls-skeleton" style="margin-top:18px">
                    <div class="skeleton skeleton-circle" style="width:32px;height:32px"></div>
                    <div class="skeleton skeleton-circle" style="width:48px;height:48px"></div>
                    <div class="skeleton skeleton-circle" style="width:32px;height:32px"></div>
                </div>
            </div>`;
    }

    // --- Search ---
    function doSearch(query) {
        query = (query || '').trim();
        if (!query) { return; }
        showScreen('results');
        const queryLabel = $('#results-query');
        if (queryLabel) { queryLabel.textContent = `"${query}"`; }
        showResultsSkeleton();
        vscode.postMessage({ type: 'search', query });
    }

    // --- Render results ---
    function renderResults(items) {
        results = items;
        const container = $('#results-container');
        container.innerHTML = '';

        if (!items || items.length === 0) {
            container.innerHTML = '<div class="no-results">No results found. Try a different search.</div>';
            return;
        }

        items.forEach((item, i) => {
            const el = document.createElement('div');
            el.className = 'result-item';
            el.innerHTML = `
                <img class="result-thumbnail" src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy"
                     onerror="this.style.background='rgba(128,128,128,0.15)';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1 1%22/>'">
                <div class="result-info">
                    <div class="result-title">${escapeHtml(item.title)}</div>
                    <div class="result-meta">
                        ${escapeHtml(item.artist)}${item.album ? ` · ${escapeHtml(item.album)}` : ''} · ${formatDuration(item.duration)}
                    </div>
                </div>`;
            el.addEventListener('click', () => playTrack(i));
            container.appendChild(el);
        });
    }

    // --- Play track ---
    function playTrack(index) {
        currentIndex = index;
        const track = results[index];
        if (!track) { return; }
        showScreen('player');
        showPlayerSkeleton();
        vscode.postMessage({ type: 'getStream', videoId: track.videoId });
    }

    // --- Render player ---
    function renderPlayer(data) {
        const container = $('#player-container');
        container.innerHTML = `
            <div class="player-content">
                <img class="player-art" src="${escapeHtml(data.thumbnail)}" alt=""
                     onerror="this.style.background='rgba(128,128,128,0.15)'">
                <div class="player-title">${escapeHtml(data.title)}</div>
                <div class="player-artist">${escapeHtml(data.artist)}${data.album ? ` • ${escapeHtml(data.album)}` : ''}</div>
                <div class="player-progress">
                    <span id="current-time">0:00</span>
                    <input type="range" id="progress-bar" class="progress-bar" min="0" max="1000" value="0" step="1">
                    <span id="total-time">${formatDuration(data.duration)}</span>
                </div>
                <div class="player-controls">
                    <button id="prev-btn" class="control-btn" aria-label="Previous">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                        </svg>
                    </button>
                    <button id="play-pause-btn" class="control-btn play-btn" aria-label="Play">
                        <svg id="icon-play" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg id="icon-pause" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="display:none">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                    </button>
                    <button id="next-btn" class="control-btn" aria-label="Next">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                        </svg>
                    </button>
                </div>
            </div>`;

        // Start audio
        audio.src = data.url;
        audio.play().then(() => {
            isPlaying = true;
            updatePlayPauseIcon();
        }).catch(() => {
            isPlaying = false;
            updatePlayPauseIcon();
        });

        setupPlayerEvents();
    }

    // --- Player controls ---
    function updatePlayPauseIcon() {
        const play = $('#icon-play');
        const pause = $('#icon-pause');
        if (!play || !pause) { return; }
        play.style.display  = isPlaying ? 'none' : 'block';
        pause.style.display = isPlaying ? 'block' : 'none';
    }

    function setupPlayerEvents() {
        const playPauseBtn = $('#play-pause-btn');
        const prevBtn = $('#prev-btn');
        const nextBtn = $('#next-btn');
        const progressBar = $('#progress-bar');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (isPlaying) {
                    audio.pause();
                    isPlaying = false;
                } else {
                    audio.play();
                    isPlaying = true;
                }
                updatePlayPauseIcon();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentIndex > 0) { playTrack(currentIndex - 1); }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentIndex < results.length - 1) { playTrack(currentIndex + 1); }
            });
        }

        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                if (audio.duration) {
                    audio.currentTime = (e.target.value / 1000) * audio.duration;
                }
            });
        }
    }

    // --- Audio events ---
    audio.addEventListener('timeupdate', () => {
        const bar = $('#progress-bar');
        const cur = $('#current-time');
        if (bar && audio.duration) {
            bar.value = Math.floor((audio.currentTime / audio.duration) * 1000);
        }
        if (cur) {
            cur.textContent = formatDuration(Math.floor(audio.currentTime));
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        const tot = $('#total-time');
        if (tot) { tot.textContent = formatDuration(Math.floor(audio.duration)); }
    });

    audio.addEventListener('ended', () => {
        if (currentIndex < results.length - 1) {
            playTrack(currentIndex + 1);
        } else {
            isPlaying = false;
            updatePlayPauseIcon();
        }
    });

    audio.addEventListener('error', () => {
        const container = $('#player-container');
        if (container) {
            container.innerHTML = '<div class="error-msg">Could not play this track.<br>Try another one.</div>';
        }
    });

    // --- Messages from extension ---
    window.addEventListener('message', (event) => {
        const msg = event.data;
        switch (msg.type) {
            case 'searchResults':
                renderResults(msg.results);
                break;
            case 'streamReady':
                renderPlayer(msg);
                break;
            case 'error':
                handleError(msg.message);
                break;
        }
    });

    function handleError(text) {
        const resultsContainer = $('#results-container');
        const playerContainer = $('#player-container');
        const errHtml = `<div class="error-msg">${escapeHtml(text)}</div>`;

        if (resultsContainer && $('#screen-results').classList.contains('active')) {
            resultsContainer.innerHTML = errHtml;
        } else if (playerContainer && $('#screen-player').classList.contains('active')) {
            playerContainer.innerHTML = errHtml;
        }
    }

    // --- Init events ---
    const searchInput = $('#search-input');
    const searchBtn = $('#search-btn');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { doSearch(searchInput.value); }
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) { doSearch(searchInput.value); }
        });
    }

    // Quick access buttons
    $$('.qa-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query') || btn.textContent;
            if (searchInput) { searchInput.value = query; }
            doSearch(query);
        });
    });

    // Back buttons
    const backToSearch = $('#back-to-search');
    if (backToSearch) {
        backToSearch.addEventListener('click', () => {
            showScreen('search');
        });
    }

    const backToResults = $('#back-to-results');
    if (backToResults) {
        backToResults.addEventListener('click', () => {
            showScreen('results');
        });
    }
}());
