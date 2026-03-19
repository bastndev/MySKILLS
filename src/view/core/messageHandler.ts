import * as vscode from 'vscode';
import { searchMusic, getStreamUrl } from './musicApi';

export function handleWebviewMessage(
    webviewView: vscode.WebviewView,
    message: any,
) {
    switch (message.type) {
        case 'search':
            handleSearch(webviewView, message.query);
            break;
        case 'getStream':
            handleGetStream(webviewView, message.videoId);
            break;
    }
}

async function handleSearch(webviewView: vscode.WebviewView, query: string) {
    try {
        const results = await searchMusic(query);
        webviewView.webview.postMessage({ type: 'searchResults', results });
    } catch (error) {
        console.error('[RENE Music] Search error:', error);
        webviewView.webview.postMessage({
            type: 'error',
            message: 'Failed to search. Check your connection.',
        });
    }
}

async function handleGetStream(webviewView: vscode.WebviewView, videoId: string) {
    try {
        const stream = await getStreamUrl(videoId);
        webviewView.webview.postMessage({ type: 'streamReady', ...stream });
    } catch (error) {
        console.error('[RENE Music] Stream error:', error);
        webviewView.webview.postMessage({
            type: 'error',
            message: 'Failed to load track. Try another.',
        });
    }
}
