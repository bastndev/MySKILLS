import * as https from 'https';

const PIPED_API = 'https://pipedapi.kavin.rocks';

export interface SearchResult {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
}

export interface StreamInfo {
    url: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
}

function httpGet(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);

        https.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                clearTimeout(timeout);
                httpGet(res.headers.location).then(resolve).catch(reject);
                return;
            }

            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                clearTimeout(timeout);
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error('Invalid JSON response'));
                }
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}

export async function searchMusic(query: string): Promise<SearchResult[]> {
    const url = `${PIPED_API}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
    const data = await httpGet(url);

    if (!data.items || !Array.isArray(data.items)) {
        return [];
    }

    return data.items
        .filter((item: any) => item.url && item.title)
        .slice(0, 20)
        .map((item: any) => ({
            videoId: item.url.replace('/watch?v=', ''),
            title: item.title,
            artist: item.uploaderName || 'Unknown',
            thumbnail: item.thumbnail || '',
            duration: item.duration || 0,
        }));
}

export async function getStreamUrl(videoId: string): Promise<StreamInfo> {
    const url = `${PIPED_API}/streams/${encodeURIComponent(videoId)}`;
    const data = await httpGet(url);

    if (!data.audioStreams || data.audioStreams.length === 0) {
        throw new Error('No audio streams available');
    }

    const audioStream = data.audioStreams
        .filter((s: any) => s.mimeType && s.mimeType.startsWith('audio/'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (!audioStream) {
        throw new Error('No compatible audio stream found');
    }

    return {
        url: audioStream.url,
        title: data.title || 'Unknown',
        artist: data.uploader || 'Unknown',
        thumbnail: data.thumbnailUrl || '',
        duration: data.duration || 0,
    };
}
