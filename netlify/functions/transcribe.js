// Transcribe YouTube video - using YouTube's internal APIs
// This mimics how browser-based transcript tools work

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

        // Get video info using YouTube's internal player API
        const playerResponse = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'WEB',
                        clientVersion: '2.20240111.09.00'
                    }
                },
                videoId: videoId
            })
        });

        if (!playerResponse.ok) {
            console.log('Player API failed:', playerResponse.status);
            throw new Error('Failed to get video info');
        }

        const playerData = await playerResponse.json();

        // Get video title
        const videoTitle = playerData?.videoDetails?.title || 'YouTube Video';

        // Get caption tracks from player response
        const captionTracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            // Try alternative: fetch the video page and extract captions
            const alternativeTranscript = await tryAlternativeMethod(videoId);
            if (alternativeTranscript) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        transcript: alternativeTranscript,
                        title: videoTitle
                    })
                };
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'This video does not have captions available.'
                })
            };
        }

        // Find the best caption track (prefer English)
        let captionTrack = captionTracks.find(t =>
            t.languageCode === 'en' ||
            t.languageCode?.startsWith('en')
        );

        // If no English, use first available
        if (!captionTrack) {
            captionTrack = captionTracks[0];
        }

        console.log('Found caption track:', captionTrack.languageCode);

        // Fetch the actual captions
        const captionUrl = captionTrack.baseUrl;
        const captionResponse = await fetch(captionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!captionResponse.ok) {
            throw new Error('Failed to fetch caption content');
        }

        const captionXml = await captionResponse.text();
        const transcript = parseXmlCaptions(captionXml);

        if (!transcript) {
            throw new Error('Failed to parse captions');
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                transcript,
                title: videoTitle,
                language: captionTrack.languageCode
            })
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

async function tryAlternativeMethod(videoId) {
    try {
        // Try fetching with Android client which sometimes has better access
        const androidResponse = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12; GB) gzip'
            },
            body: JSON.stringify({
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'ANDROID',
                        clientVersion: '17.36.4',
                        androidSdkVersion: 31
                    }
                },
                videoId: videoId
            })
        });

        if (!androidResponse.ok) {
            return null;
        }

        const data = await androidResponse.json();
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return null;
        }

        const track = tracks.find(t => t.languageCode?.startsWith('en')) || tracks[0];

        if (!track?.baseUrl) {
            return null;
        }

        const captionRes = await fetch(track.baseUrl);
        if (!captionRes.ok) {
            return null;
        }

        const xml = await captionRes.text();
        return parseXmlCaptions(xml);

    } catch (e) {
        console.log('Alternative method failed:', e.message);
        return null;
    }
}

function parseXmlCaptions(xml) {
    try {
        const textMatches = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];

        if (textMatches.length === 0) {
            // Try JSON format (some captions come as JSON)
            try {
                const json = JSON.parse(xml);
                if (json.events) {
                    return json.events
                        .filter(e => e.segs)
                        .map(e => e.segs.map(s => s.utf8 || '').join(''))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            } catch (e) {
                // Not JSON, continue with XML parsing
            }
            return null;
        }

        const texts = textMatches.map(match => {
            let text = match[1];
            return text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
                .replace(/\n/g, ' ')
                .trim();
        });

        return texts.join(' ').replace(/\s+/g, ' ').trim();
    } catch (e) {
        console.error('Parse error:', e.message);
        return null;
    }
}
