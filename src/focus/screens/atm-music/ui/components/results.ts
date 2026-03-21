import { $, escapeHtml, formatDuration } from '../../../../shared/utils';
import { Track } from '../../../../shared/types';

export class MusicResultsUI {
    private container: HTMLElement | null = null;
    private queryInput: HTMLInputElement | null = null;
    private queryBtn: HTMLButtonElement | null = null;
    private lastQuery = '';

    constructor(
        private readonly onSelect: (index: number) => void,
        private readonly onSearch: (query: string) => void,
        private readonly onBack: () => void
    ) {
        this.container = $('#results-container');
        this.queryInput = $('#results-query-input') as HTMLInputElement | null;
        this.queryBtn = $('#results-query-btn') as HTMLButtonElement | null;
        this.setupEvents();
    }

    public setQuery(query: string) {
        if (this.queryInput) {
            this.queryInput.value = query;
            this.lastQuery = query;
            this.updateButtonState();
        }
    }

    public showSkeleton() {
        if (!this.container) return;
        this.container.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'result-item skeleton-item';
            el.innerHTML = `
                <div class="skeleton skeleton-thumbnail"></div>
                <div class="skeleton-info">
                    <div class="skeleton skeleton-line long"></div>
                    <div class="skeleton skeleton-line short"></div>
                </div>
            `;
            this.container.appendChild(el);
        }
    }

    public render(items: Track[]) {
        if (!this.container) return;
        this.container.innerHTML = '';

        if (!items || items.length === 0) {
            this.container.innerHTML = '<div class="no-results">No results found. Try a different search.</div>';
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
                </div>
            `;
            el.addEventListener('click', () => this.onSelect(i));
            this.container?.appendChild(el);
        });
    }

    private setupEvents() {
        $('#back-to-search')?.addEventListener('click', () => this.onBack());

        if (this.queryInput) {
            this.queryInput.addEventListener('input', () => this.updateButtonState());
            this.queryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const q = (this.queryInput?.value || '').trim();
                    if (q && q !== this.lastQuery) this.onSearch(q);
                }
            });
        }

        if (this.queryBtn) {
            this.queryBtn.addEventListener('click', () => {
                const q = (this.queryInput?.value || '').trim();
                if (q && q !== this.lastQuery) this.onSearch(q);
            });
        }
    }

    private updateButtonState() {
        if (!this.queryBtn) return;
        const q = (this.queryInput?.value || '').trim();
        const isDisabled = !q || q === this.lastQuery;
        this.queryBtn.disabled = isDisabled;
        this.queryBtn.classList.toggle('is-disabled', isDisabled);
    }
}
