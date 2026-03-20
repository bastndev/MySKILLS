declare const acquireVsCodeApi: () => { postMessage: (message: unknown) => void };

import { createAtmMusicController } from '../../screens/atm-music/ui/index';
import { timeScreenContent } from '../../screens/atm-time/time';
import { gameScreenContent } from '../../screens/atm-game/game';

(function () {
    const vscode = acquireVsCodeApi();
    const musicController = createAtmMusicController(vscode);

    const searchInput = document.querySelector('#search-input') as HTMLInputElement | null;
    const quickAccessButtons = Array.from(document.querySelectorAll('.qa-btn')) as HTMLButtonElement[];
    const musicQuickButton = quickAccessButtons[0] || null;
    const screenSearch = document.querySelector('#screen-search') as HTMLElement | null;
    const screenTime = document.querySelector('#screen-time') as HTMLElement | null;
    const screenGame = document.querySelector('#screen-game') as HTMLElement | null;
    const screenResults = document.querySelector('#screen-results') as HTMLElement | null;
    const screenPlayer = document.querySelector('#screen-player') as HTMLElement | null;
    const atmTimeRoot = document.querySelector('#atm-time-root') as HTMLElement | null;
    const atmGameRoot = document.querySelector('#atm-game-root') as HTMLElement | null;

    if (atmTimeRoot) {
        atmTimeRoot.innerHTML = timeScreenContent;
    }

    if (atmGameRoot) {
        atmGameRoot.innerHTML = gameScreenContent;
    }

    const setActiveScreen = (target: 'search' | 'time' | 'game') => {
        if (screenSearch) {
            screenSearch.classList.toggle('active', target === 'search');
        }

        if (screenTime) {
            screenTime.classList.toggle('active', target === 'time');
        }

        if (screenGame) {
            screenGame.classList.toggle('active', target === 'game');
        }

        if (screenResults) {
            screenResults.classList.remove('active');
        }

        if (screenPlayer) {
            screenPlayer.classList.remove('active');
        }

        quickAccessButtons.forEach((button) => {
            const isMusicButton = button === musicQuickButton;
            const isActive = isMusicButton ? target === 'search' : button.dataset.screen === target;
            button.classList.toggle('is-active', isActive);

            if (isActive) {
                button.setAttribute('aria-current', 'true');
            } else {
                button.removeAttribute('aria-current');
            }
        });
    };

    const backToSearchButtons = Array.from(document.querySelectorAll('[data-back-to="search"]')) as HTMLButtonElement[];
    backToSearchButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setActiveScreen('search');
        });
    });

    quickAccessButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const target = button.dataset.screen;

            if (target === 'time' || target === 'game') {
                setActiveScreen(target);
            }
        });
    });

    if (searchInput) {
        searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                musicController.search(searchInput.value);
            }
        });
    }
}());
