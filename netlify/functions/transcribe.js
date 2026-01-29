// Transcribe YouTube video using youtube-transcript npm package
import { YoutubeTranscript } from 'youtube-transcript';

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { videoId } = JSON.parse(event.body || '{}');

        if (!videoId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Video ID is required' })
            };
        }

        console.log('Fetching transcript for:', videoId);

        // Get video title first
        let videoTitle = 'YouTube Video';
        try {
            const oembedRes = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            );
            if (oembedRes.ok) {
                const oembed = await oembedRes.json();
                videoTitle = oembed.title || 'YouTube Video';
            }
        } catch (e) {
            console.log('Could not fetch video title');
        }

        // Use the npm package to fetch transcript
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
                lang: 'en'
            });

            if (!transcriptItems || transcriptItems.length === 0) {
                throw new Error('No transcript found');
            }

            // Combine all transcript segments
            const transcript = transcriptItems
                .map(item => item.text)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    transcript,
                    title: videoTitle,
                    segments: transcriptItems.length
                })
            };

        } catch (transcriptError) {
            console.error('Transcript fetch error:', transcriptError.message);

            // Try without language preference
            try {
                const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

                if (!transcriptItems || transcriptItems.length === 0) {
                    throw new Error('No transcript found');
                }

                const transcript = transcriptItems
                    .map(item => item.text)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        transcript,
                        title: videoTitle,
                        segments: transcriptItems.length
                    })
                };

            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError.message);

                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: `Could not fetch transcript: ${fallbackError.message}. Make sure the video has captions enabled.`
                    })
                };
            }
        }

    } catch (error) {
        console.error('Transcribe error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch transcript: ' + error.message })
        };
    }
}
