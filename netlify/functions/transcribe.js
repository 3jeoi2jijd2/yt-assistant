// Transcribe YouTube video using Supadata free API
// This API works from cloud servers unlike direct YouTube scraping

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

        let transcript = null;

        // Method 1: Try Supadata API (works from cloud servers)
        try {
            const supadataRes = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (supadataRes.ok) {
                const data = await supadataRes.json();
                if (data.content && data.content.length > 0) {
                    transcript = data.content
                        .map(item => item.text)
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            } else {
                console.log('Supadata returned:', supadataRes.status);
            }
        } catch (e) {
            console.log('Supadata API failed:', e.message);
        }

        // Method 2: Try RapidAPI YouTube Transcript (free tier available)
        if (!transcript) {
            try {
                const rapidRes = await fetch(`https://youtube-transcriptor.p.rapidapi.com/transcript?video_id=${videoId}&lang=en`, {
                    headers: {
                        'X-RapidAPI-Key': 'free-tier',
                        'X-RapidAPI-Host': 'youtube-transcriptor.p.rapidapi.com'
                    }
                });

                if (rapidRes.ok) {
                    const data = await rapidRes.json();
                    if (data && Array.isArray(data)) {
                        transcript = data
                            .map(item => item.text || item.subtitle)
                            .filter(Boolean)
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                    }
                }
            } catch (e) {
                console.log('RapidAPI failed:', e.message);
            }
        }

        // Method 3: Try Tactiq's public endpoint
        if (!transcript) {
            try {
                const tactiqRes = await fetch(`https://tactiq-apps-prod.tactiq.io/transcript`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ videoId, langCode: 'en' })
                });

                if (tactiqRes.ok) {
                    const data = await tactiqRes.json();
                    if (data.captions && data.captions.length > 0) {
                        transcript = data.captions
                            .map(c => c.text)
                            .join(' ')
                            .replace(/\s+/g, ' ')
                            .trim();
                    }
                }
            } catch (e) {
                console.log('Tactiq failed:', e.message);
            }
        }

        // Method 4: Direct Google timedtext API
        if (!transcript) {
            try {
                const languages = ['en', 'en-US', 'a.en', 'asr'];
                for (const lang of languages) {
                    const timedtextUrl = `http://video.google.com/timedtext?lang=${lang}&v=${videoId}`;
                    const ttRes = await fetch(timedtextUrl);

                    if (ttRes.ok) {
                        const xml = await ttRes.text();
                        if (xml && xml.includes('<text')) {
                            const textMatches = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];
                            if (textMatches.length > 0) {
                                transcript = textMatches
                                    .map(m => m[1]
                                        .replace(/&amp;/g, '&')
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&#39;/g, "'")
                                        .replace(/&quot;/g, '"')
                                        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
                                    )
                                    .join(' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.log('Timedtext failed:', e.message);
            }
        }

        // Method 5: YouTube's own transcript page scraping
        if (!transcript) {
            try {
                // Try fetching from YouTube's mobile site which is simpler
                const mobileUrl = `https://m.youtube.com/watch?v=${videoId}`;
                const mobileRes = await fetch(mobileUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                        'Accept-Language': 'en-US,en;q=0.9'
                    }
                });

                if (mobileRes.ok) {
                    const html = await mobileRes.text();

                    // Look for caption tracks in player response
                    const captionMatch = html.match(/"captionTracks":\s*\[(.*?)\]/);
                    if (captionMatch) {
                        try {
                            const tracks = JSON.parse('[' + captionMatch[1] + ']');
                            const enTrack = tracks.find(t => t.languageCode?.startsWith('en')) || tracks[0];

                            if (enTrack?.baseUrl) {
                                const captionRes = await fetch(enTrack.baseUrl);
                                if (captionRes.ok) {
                                    const captionXml = await captionRes.text();
                                    const textMatches = [...captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)];
                                    if (textMatches.length > 0) {
                                        transcript = textMatches
                                            .map(m => m[1]
                                                .replace(/&amp;/g, '&')
                                                .replace(/&#39;/g, "'")
                                                .replace(/&quot;/g, '"')
                                            )
                                            .join(' ')
                                            .replace(/\s+/g, ' ')
                                            .trim();
                                    }
                                }
                            }
                        } catch (parseErr) {
                            console.log('Caption parse failed');
                        }
                    }
                }
            } catch (e) {
                console.log('Mobile scraping failed:', e.message);
            }
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript from any source. The video may not have captions, or all transcript services are currently unavailable.'
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
