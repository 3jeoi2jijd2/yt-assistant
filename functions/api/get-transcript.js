import { YoutubeTranscript } from 'youtube-transcript';

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

        // Use the library to fetch transcript
        // Note: The library uses fetch internally which is compatible with Cloudflare Workers
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcriptItems || transcriptItems.length === 0) {
            return new Response(JSON.stringify({ error: 'No captions found for this video.' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        // Format similarly to our previous structure
        // structure: { text: string, duration: number, offset: number }
        const formattedTranscript = transcriptItems.map(item => ({
            text: item.text,
            start: item.offset / 1000, // library returns ms, we want seconds
            duration: item.duration / 1000
        }));

        const fullText = formattedTranscript.map(s => s.text).join(' ');

        return new Response(JSON.stringify({
            videoId,
            title: 'Transcript', // The library doesn't fetch title, but that's fine
            language: 'en', // Usually defaults to English or auto
            transcript: formattedTranscript,
            fullText: fullText
        }), {
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Transcript error:', error);

        let errorMessage = 'Failed to fetch transcript';
        if (error.message.includes('Sign in')) {
            errorMessage = 'Video is age-restricted or requires sign-in.';
        } else if (error.message.includes('Captions disabled')) {
            errorMessage = 'Captions are disabled for this video.';
        }

        return new Response(JSON.stringify({
            error: errorMessage,
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
