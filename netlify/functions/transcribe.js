// Transcribe YouTube video - Multiple client approach
// YouTube restricts some clients from cloud IPs, so we try different ones

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

        // Get video title
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
            console.log('Could not fetch title');
        }

        let transcript = null;
        let captionTracks = null;

        // Client configurations to try - different clients have different restrictions
        const clients = [
            {
                name: 'WEB',
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'WEB',
                        clientVersion: '2.20240111.09.00'
                    }
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            {
                name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
                        clientVersion: '2.0'
                    },
                    thirdParty: {
                        embedUrl: 'https://www.youtube.com'
                    }
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                name: 'IOS',
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'IOS',
                        clientVersion: '19.09.3',
                        deviceModel: 'iPhone14,3'
                    }
                },
                userAgent: 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)'
            },
            {
                name: 'ANDROID',
                context: {
                    client: {
                        hl: 'en',
                        gl: 'US',
                        clientName: 'ANDROID',
                        clientVersion: '19.09.37',
                        androidSdkVersion: 30
                    }
                },
                userAgent: 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
            }
        ];

        // Try each client until we get captions
        for (const client of clients) {
            try {
                console.log(`Trying ${client.name} client...`);

                const response = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': client.userAgent,
                        'X-Youtube-Client-Name': client.name === 'WEB' ? '1' : client.name === 'ANDROID' ? '3' : client.name === 'IOS' ? '5' : '85',
                        'X-Youtube-Client-Version': client.context.client.clientVersion
                    },
                    body: JSON.stringify({
                        context: client.context,
                        videoId: videoId,
                        playbackContext: {
                            contentPlaybackContext: {
                                signatureTimestamp: 19950
                            }
                        },
                        contentCheckOk: true,
                        racyCheckOk: true
                    })
                });

                if (!response.ok) {
                    console.log(`${client.name} returned ${response.status}`);
                    continue;
                }

                const data = await response.json();
                captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

                if (captionTracks && captionTracks.length > 0) {
                    console.log(`Found ${captionTracks.length} caption tracks with ${client.name}`);

                    // Get the best track
                    const track = captionTracks.find(t => t.languageCode?.startsWith('en')) || captionTracks[0];

                    if (track?.baseUrl) {
                        const captionRes = await fetch(track.baseUrl, {
                            headers: { 'User-Agent': client.userAgent }
                        });

                        if (captionRes.ok) {
                            const xml = await captionRes.text();
                            transcript = parseXmlCaptions(xml);

                            if (transcript) {
                                console.log(`Successfully got transcript with ${client.name}`);
                                break;
                            }
                        }
                    }
                } else {
                    console.log(`${client.name}: No caption tracks in response`);
                }
            } catch (e) {
                console.log(`${client.name} error:`, e.message);
            }
        }

        // If no transcript yet, try the embed approach
        if (!transcript) {
            console.log('Trying embed approach...');
            transcript = await tryEmbedApproach(videoId);
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. YouTube may be blocking requests from our server. Try again later or use a different video.'
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

async function tryEmbedApproach(videoId) {
    try {
        // Fetch the embed page which sometimes has different restrictions
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        const embedRes = await fetch(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!embedRes.ok) return null;

        const html = await embedRes.text();

        // Look for caption data in the embed page
        const captionMatch = html.match(/"captions":\s*(\{[^}]+playerCaptionsTracklistRenderer[^}]+\})/);
        if (!captionMatch) {
            // Try finding baseUrl directly
            const baseUrlMatch = html.match(/"baseUrl":\s*"([^"]+timedtext[^"]+)"/);
            if (baseUrlMatch) {
                let baseUrl = baseUrlMatch[1].replace(/\\u0026/g, '&');
                const captionRes = await fetch(baseUrl);
                if (captionRes.ok) {
                    const xml = await captionRes.text();
                    return parseXmlCaptions(xml);
                }
            }
            return null;
        }

        return null;
    } catch (e) {
        console.log('Embed approach failed:', e.message);
        return null;
    }
}

function parseXmlCaptions(xml) {
    try {
        // Handle XML format
        const textMatches = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];

        if (textMatches.length > 0) {
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
        }

        // Try JSON3 format
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
            // Not JSON
        }

        return null;
    } catch (e) {
        console.error('Parse error:', e.message);
        return null;
    }
}
