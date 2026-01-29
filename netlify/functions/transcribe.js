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

        if (YOUTUBE_API_KEY) {
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
        }

        // Try multiple transcript sources
        let transcript = null;

        // Method 1: Try youtubetranscript.com API
        try {
            const transcriptRes = await fetch(
                `https://youtubetranscript.com/?server_vid2=${videoId}`
            );
            if (transcriptRes.ok) {
                const text = await transcriptRes.text();
                // Parse the XML-like response
                const matches = text.match(/<text[^>]*>([^<]*)<\/text>/g);
                if (matches && matches.length > 0) {
                    transcript = matches
                        .map(m => m.replace(/<[^>]*>/g, ''))
                        .join(' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            }
        } catch (e) {
            console.log('Method 1 failed:', e.message);
        }

        // Method 2: Try YouTube's timedtext API directly
        if (!transcript) {
            try {
                const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
                const captionRes = await fetch(captionUrl);

                if (captionRes.ok) {
                    const text = await captionRes.text();
                    if (text && text.trim()) {
                        try {
                            const captionData = JSON.parse(text);
                            if (captionData.events) {
                                transcript = captionData.events
                                    .filter(e => e.segs)
                                    .map(e => e.segs.map(s => s.utf8 || '').join(''))
                                    .join(' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            }
                        } catch (parseErr) {
                            console.log('Could not parse caption data');
                        }
                    }
                }
            } catch (e) {
                console.log('Method 2 failed:', e.message);
            }
        }

        // Method 3: Try the lemnoslife API with better error handling
        if (!transcript) {
            try {
                const transcriptResponse = await fetch(
                    `https://yt.lemnoslife.com/videos?part=transcript&id=${videoId}`
                );

                if (transcriptResponse.ok) {
                    const text = await transcriptResponse.text();
                    if (text && text.trim()) {
                        try {
                            const data = JSON.parse(text);
                            if (data.items && data.items[0] && data.items[0].transcript && data.items[0].transcript.content) {
                                transcript = data.items[0].transcript.content
                                    .map(entry => entry.text)
                                    .join(' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                            }
                        } catch (parseErr) {
                            console.log('Could not parse lemnoslife data');
                        }
                    }
                }
            } catch (e) {
                console.log('Method 3 failed:', e.message);
            }
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. This video may not have captions enabled, or captions are auto-generated in a different language.'
                })
            };
        }

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
            body: JSON.stringify({ error: 'Failed to fetch transcript: ' + error.message })
        };
    }
}
