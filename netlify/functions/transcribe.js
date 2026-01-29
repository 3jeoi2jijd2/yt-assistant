// Transcribe YouTube video - FINAL VERSION
// Uses YouTube's InnerTube API like the reliable npm packages

const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

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

        // Step 1: Get video info and transcript params from the watch page
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const watchResponse = await fetch(watchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!watchResponse.ok) {
            throw new Error('Failed to fetch video page');
        }

        const html = await watchResponse.text();

        // Extract video title
        let videoTitle = 'YouTube Video';
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        if (titleMatch) {
            videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
        }

        // Method 1: Direct caption URL extraction from ytInitialPlayerResponse
        let transcript = await extractFromPlayerResponse(html);

        // Method 2: Try InnerTube API if Method 1 fails
        if (!transcript) {
            transcript = await tryInnerTubeAPI(videoId, html);
        }

        // Method 3: Try direct timedtext API
        if (!transcript) {
            transcript = await tryTimedTextAPI(videoId);
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. This video may not have captions enabled, or the captions are restricted. Try a different video with public captions.'
                })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                transcript,
                title: videoTitle
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

async function extractFromPlayerResponse(html) {
    try {
        // Find ytInitialPlayerResponse in the page
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
        if (!playerResponseMatch) {
            console.log('No ytInitialPlayerResponse found');
            return null;
        }

        // Parse the JSON - need to be careful with the ending
        let jsonStr = playerResponseMatch[1];
        let playerResponse;

        try {
            playerResponse = JSON.parse(jsonStr);
        } catch (e) {
            // Try to find a valid JSON by counting braces
            let braceCount = 0;
            let endIndex = 0;
            for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') braceCount++;
                if (jsonStr[i] === '}') braceCount--;
                if (braceCount === 0 && i > 0) {
                    endIndex = i + 1;
                    break;
                }
            }
            if (endIndex > 0) {
                jsonStr = jsonStr.substring(0, endIndex);
                playerResponse = JSON.parse(jsonStr);
            } else {
                throw e;
            }
        }

        // Get caption tracks
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            console.log('No caption tracks found');
            return null;
        }

        // Find best caption track (prefer English, then any)
        let track = captionTracks.find(t => t.languageCode?.startsWith('en')) || captionTracks[0];

        if (!track?.baseUrl) {
            console.log('No valid caption URL found');
            return null;
        }

        console.log('Found caption track:', track.languageCode);

        // Fetch captions
        const captionResponse = await fetch(track.baseUrl);
        if (!captionResponse.ok) {
            console.log('Failed to fetch captions from baseUrl');
            return null;
        }

        const captionXml = await captionResponse.text();
        return parseXmlCaptions(captionXml);

    } catch (error) {
        console.error('extractFromPlayerResponse error:', error.message);
        return null;
    }
}

async function tryInnerTubeAPI(videoId, html) {
    try {
        // Extract serialized share entity (needed for transcript API)
        const serializedMatch = html.match(/"serializedShareEntity":"([^"]+)"/);
        const visitorDataMatch = html.match(/"visitorData":"([^"]+)"/);

        // Try to get transcript panel params
        const paramsMatch = html.match(/"params":"([^"]+)"\s*,\s*"type":"ENGAGEMENT_PANEL_SEARCHABLE_TRANSCRIPT"/);

        if (!paramsMatch) {
            console.log('No transcript params found');
            return null;
        }

        const params = paramsMatch[1];

        // Call the InnerTube get_transcript endpoint
        const response = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${INNERTUBE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: 'WEB',
                        clientVersion: '2.20240111.09.00'
                    }
                },
                params: params
            })
        });

        if (!response.ok) {
            console.log('InnerTube API request failed');
            return null;
        }

        const data = await response.json();

        // Extract transcript text from response
        const transcriptRenderer = data?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer;
        const cueGroups = transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.content ||
            transcriptRenderer?.body?.transcriptSegmentListRenderer?.content;

        if (!cueGroups || cueGroups.length === 0) {
            console.log('No transcript cues found in InnerTube response');
            return null;
        }

        const texts = cueGroups
            .map(cue => cue?.transcriptSegmentRenderer?.snippet?.runs?.[0]?.text)
            .filter(Boolean);

        if (texts.length === 0) {
            return null;
        }

        return texts.join(' ').replace(/\s+/g, ' ').trim();

    } catch (error) {
        console.error('tryInnerTubeAPI error:', error.message);
        return null;
    }
}

async function tryTimedTextAPI(videoId) {
    try {
        // Try YouTube's timedtext API directly with common language codes
        const languages = ['en', 'en-US', 'en-GB', 'a.en'];

        for (const lang of languages) {
            const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.events && data.events.length > 0) {
                    const texts = data.events
                        .filter(e => e.segs)
                        .map(e => e.segs.map(s => s.utf8 || '').join(''))
                        .filter(Boolean);

                    if (texts.length > 0) {
                        return texts.join(' ').replace(/\s+/g, ' ').trim();
                    }
                }
            }
        }

        return null;
    } catch (error) {
        console.error('tryTimedTextAPI error:', error.message);
        return null;
    }
}

function parseXmlCaptions(xml) {
    // Extract text from XML captions: <text start="0" dur="5.5">Caption text</text>
    const textMatches = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];

    if (textMatches.length === 0) {
        return null;
    }

    const texts = textMatches.map(match => {
        let text = match[1];
        // Decode HTML entities
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
            .replace(/\n/g, ' ')
            .trim();
    });

    return texts.join(' ').replace(/\s+/g, ' ').trim();
}
