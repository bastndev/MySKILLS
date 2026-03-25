import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { song_url } from 'NeteaseCloudMusicApi';
import { searchMusic } from './api';
import { WebviewMessage } from '../../../shared/types';

let streamServer: http.Server | null = null;
let streamPort = 0;

export function startAudioServer(): Promise<number> {
    if (streamServer && streamPort > 0) return Promise.resolve(streamPort);

    streamServer = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url || '', `http://${req.headers.host || '127.0.0.1'}`);
            if (url.pathname === '/stream') {
                const videoId = url.searchParams.get('videoId');
                if (!videoId) {
                    res.writeHead(400); 
                    return res.end('Missing videoId');
                }

                res.setHeader('Access-Control-Allow-Origin', '*');

                // Get true authorized streaming URL from Netease
                const urlResult = await song_url({ id: videoId, br: 320000 });
                const realUrl = (urlResult.body as any).data?.[0]?.url;

                if (!realUrl) {
                    res.writeHead(404);
                    return res.end('Track unavailable');
                }

                const protocol = realUrl.startsWith('https') ? https : http;
                protocol.get(realUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Referer': 'https://music.163.com/',
                        'Cookie': 'os=pc; osver=Microsoft-Windows-10-Professional-build-19041-64bit; appver=2.9.0;'
                    }
                }, (streamRes) => {
                    res.writeHead(streamRes.statusCode || 200, {
                        'Content-Type': streamRes.headers['content-type'] || 'audio/mpeg',
                        'Transfer-Encoding': 'chunked'
                    });
                    
                    streamRes.pipe(res);
                }).on('error', (e) => {
                    console.error('[RENE Music] Pipe error:', e);
                    if (!res.headersSent) {
                        res.writeHead(500);
                        res.end();
                    }
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
                console.log(`[RENE Music] NetEase Proxy running on port ${streamPort}`);
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
