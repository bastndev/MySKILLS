import * as vscode from 'vscode';
import * as http from 'http';
import ytdl from '@distube/ytdl-core';
import { searchMusic } from './api';
import { WebviewMessage } from '../../../shared/types';

let streamServer: http.Server | null = null;
let streamPort = 0;

export function startAudioServer(): Promise<number> {
    if (streamServer && streamPort > 0) return Promise.resolve(streamPort);

    streamServer = http.createServer((req, res) => {
        try {
            const url = new URL(req.url || '', `http://${req.headers.host || '127.0.0.1'}`);
            if (url.pathname === '/stream') {
                const videoId = url.searchParams.get('videoId');
                if (!videoId) {
                    res.writeHead(400); 
                    return res.end('Missing videoId');
                }

                res.setHeader('Access-Control-Allow-Origin', '*');
                res.writeHead(200, {
                    'Content-Type': 'audio/mpeg',
                    'Transfer-Encoding': 'chunked'
                });

                const stream = ytdl(videoId, { 
                    filter: 'audioonly',
                    quality: 'highestaudio' 
                });
                
                stream.pipe(res);
                
                req.on('close', () => {
                    stream.destroy();
                });
            } else {
                res.writeHead(404);
                res.end();
            }
        } catch (err) {
            console.error('[RENE Music] Stream error:', err);
            if (!res.headersSent) {
                res.writeHead(500);
                res.end();
            }
        }
    });

    return new Promise((resolve) => {
        streamServer!.listen(0, '127.0.0.1', () => {
            const addr = streamServer?.address();
            if (addr && typeof addr !== 'string') {
                streamPort = addr.port;
                console.log(`[RENE Music] Audio server running on port ${streamPort}`);
                resolve(streamPort);
            } else {
                resolve(0);
            }
        });
    });
}

export async function handleWebviewMessage(
    webviewView: vscode.WebviewView,
    message: WebviewMessage,
) {
    if (message.type === 'ready') {
        const port = await startAudioServer();
        webviewView.webview.postMessage({
            type: 'config',
            streamPort: port
        } as WebviewMessage);
    } else if (message.type === 'search' && message.query) {
        handleSearch(webviewView, message.query);
    }
}

async function handleSearch(webviewView: vscode.WebviewView, query: string) {
    try {
        const results = await searchMusic(query);
        webviewView.webview.postMessage({ 
            type: 'searchResults', 
            results 
        } as WebviewMessage);
    } catch (error) {
        console.error('[RENE Music] Search error:', error);
        webviewView.webview.postMessage({
            type: 'error',
            message: 'Failed to search. Check your connection.',
        } as WebviewMessage);
    }
}
