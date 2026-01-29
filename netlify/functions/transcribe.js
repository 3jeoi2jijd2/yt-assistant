// Transcribe YouTube video
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

        // First, get video title using YouTube API
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        let videoTitle = 'YouTube Video';

        try {
            const videoInfoRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
            );
            const videoInfo = await videoInfoRes.json();
            if (videoInfo.items && videoInfo.items.length > 0) {
                videoTitle = videoInfo.items[0].snippet.title;
            }
        } catch (e) {
            console.log('Could not fetch video title:', e);
        }

        // Fetch transcript using youtube-transcript API (via a free service)
        // Using the innertube API approach
        const transcriptResponse = await fetch(
            `https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`
        );

        if (!transcriptResponse.ok) {
            // Try alternative method - use YouTube's timedtext API
            const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
            const captionRes = await fetch(captionUrl);

            if (captionRes.ok) {
                const captionData = await captionRes.json();
                if (captionData.events) {
                    const transcript = captionData.events
                        .filter(e => e.segs)
                        .map(e => e.segs.map(s => s.utf8).join(''))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ transcript, title: videoTitle })
                    };
                }
            }

            // If both methods fail, return an error
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. This video may not have captions enabled.'
                })
            };
        }

        const data = await transcriptResponse.json();

        if (!data.items || !data.items[0] || !data.items[0].transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'No transcript available for this video'
                })
            };
        }

        // Format transcript
        const transcriptEntries = data.items[0].transcript.content;
        const transcript = transcriptEntries
            .map(entry => entry.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ transcript, title: videoTitle })
        };

    } catch (error) {
        console.error('Transcribe error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch transcript' })
        };
    }
}
