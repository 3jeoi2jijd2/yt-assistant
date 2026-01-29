export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { url } = await context.request.json();

        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Extract Video ID
        const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : null;

        if (!videoId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // 1. Fetch Video Page
        const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const videoPageHtml = await videoPageResponse.text();

        // 2. Extract Player Response JSON
        const playerResponseMatch = videoPageHtml.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);

        if (!playerResponseMatch) {
            // Fallback: Try looking for ytInitialPlayerResponse inside script tags differently
            // Sometimes it's inside window.ytInitialPlayerResponse = ...
            return new Response(JSON.stringify({
                error: 'Could not extract video data. YouTube might be blocking requests or the video is private.'
            }), { status: 422, headers: corsHeaders });
        }

        const playerResponse = JSON.parse(playerResponseMatch[1]);

        // 3. Find Caption Tracks
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            return new Response(JSON.stringify({ error: 'No captions found for this video.' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        // 4. Prioritize English, then auto-generated, then first available
        // Sort to find English first
        captionTracks.sort((a, b) => {
            const langA = a.languageCode;
            const langB = b.languageCode;
            if (langA === 'en' && langB !== 'en') return -1;
            if (langA !== 'en' && langB === 'en') return 1;
            return 0;
        });

        const selectedTrack = captionTracks[0];
        const transcriptUrl = selectedTrack.baseUrl;

        // 5. Fetch Transcript XML
        const transcriptResponse = await fetch(transcriptUrl);
        const transcriptXml = await transcriptResponse.text();

        // 6. Parse XML manually (Regex) to extract text
        // Format: <text start="0.5" dur="3.2">Hello world</text>
        const regex = /<text start="([\d\.]+)" dur="([\d\.]+)">(.*?)<\/text>/g;
        let match;
        const segments = [];

        while ((match = regex.exec(transcriptXml)) !== null) {
            const start = parseFloat(match[1]);
            const duration = parseFloat(match[2]);
            let text = match[3];

            // Decode HTML entities
            text = text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');

            segments.push({
                start,
                duration,
                text
            });
        }

        // 7. Format Full Text
        const fullText = segments.map(s => s.text).join(' ');

        return new Response(JSON.stringify({
            videoId,
            title: playerResponse.videoDetails?.title || 'Unknown Title',
            language: selectedTrack.name?.simpleText || selectedTrack.languageCode,
            transcript: segments,
            fullText: fullText
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Transcript error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch transcript internally',
            details: error.message
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
