import ytdl from "@distube/ytdl-core";
import YTMusic from "ytmusic-api";

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

const ytmusic = new YTMusic();
let isInitialized = false;

async function initYTMusic() {
	if (!isInitialized) {
		await ytmusic.initialize();
		isInitialized = true;
	}
}

export async function searchMusic(query: string): Promise<SearchResult[]> {
	await initYTMusic();
	try {
		const songs = await ytmusic.searchSongs(query);

		return songs.slice(0, 25).map((song: any) => ({
			videoId: song.videoId,
			title: song.name,
			artist: song.artist?.name || "Unknown",
			thumbnail:
				song.thumbnails && song.thumbnails.length > 0
					? song.thumbnails[song.thumbnails.length - 1].url
					: "",
			duration: song.duration || 0,
		}));
	} catch (error) {
		console.error("[RENE Music] searchMusic error:", error);
		return [];
	}
}

export async function getStreamUrl(videoId: string): Promise<StreamInfo> {
	try {
		const info = await ytdl.getInfo(
			`https://www.youtube.com/watch?v=${videoId}`,
		);
		const format = ytdl.chooseFormat(info.formats, {
			quality: "highestaudio",
			filter: "audioonly",
		});

		if (!format || !format.url) {
			throw new Error("No compatible audio stream found");
		}

		const title = info.videoDetails.title || "Unknown";
		const artist = info.videoDetails.author.name || "Unknown";
		const thumbnails = info.videoDetails.thumbnails || [];
		const thumbnail =
			thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : "";
		const duration = Number.parseInt(
			info.videoDetails.lengthSeconds || "0",
			10,
		);

		return {
			url: format.url,
			title,
			artist,
			thumbnail,
			duration,
		};
	} catch (error) {
		console.error("[RENE Music] getStreamUrl error:", error);
		throw error;
	}
}
