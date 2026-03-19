(function () {
    const vscode = acquireVsCodeApi();
    const searchInput = /** @type {HTMLInputElement} */ (document.getElementById('search-input'));

    if (!searchInput) { return; }

    // Focus on load for better UX
    window.addEventListener('load', () => {
        searchInput.focus();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                vscode.postMessage({ type: 'search', value: query });
            }
        }
    });
}());
