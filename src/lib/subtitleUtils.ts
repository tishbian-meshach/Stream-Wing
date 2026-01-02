/**
 * Convert SRT content to WebVTT format
 */
export function srtToVtt(srtContent: string): string {
    // Basic SRT to VTT converter
    // 1. Add "WEBVTT" header
    // 2. Replace comma in timestamps with period

    // Normalize line endings
    let vtt = "WEBVTT\n\n" + srtContent
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    // Replace comma in timestamps (00:00:00,000 -> 00:00:00.000)
    vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');

    return vtt;
}

/**
 * Update video element with subtitle track
 */
export function addSubtitleTrack(video: HTMLVideoElement, vttContent: string, label: string = 'English') {
    // Remove existing tracks
    const existing = video.querySelectorAll('track');
    existing.forEach(track => track.remove());

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = label;
    track.srclang = 'en';
    track.default = true;

    const blob = new Blob([vttContent], { type: 'text/vtt' });
    track.src = URL.createObjectURL(blob);

    video.appendChild(track);
}

/**
 * Toggle subtitle track visibility
 */
export function toggleSubtitleTrack(video: HTMLVideoElement, visible: boolean) {
    const track = video.textTracks[0];
    if (track) {
        track.mode = visible ? 'showing' : 'hidden';
    }
}
