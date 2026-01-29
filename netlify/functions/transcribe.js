// Transcribe YouTube video - PRODUCTION version
// Uses the same method as TurboScribe and Tactiq

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

        // Step 1: Fetch the YouTube video page
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch video page');
        }

        const html = await response.text();

        // Step 2: Extract video title
        let videoTitle = 'YouTube Video';
        const titleMatch = html.match(/<title>([^<]*)<\/title>/);
        if (titleMatch) {
            videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
        }

        // Step 3: Extract ytInitialPlayerResponse which contains caption data
        let playerResponse = null;

        // Try different patterns to extract the player response
        const patterns = [
            /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s,
            /var ytInitialPlayerResponse\s*=\s*(\{.+?\});/s,
            /"ytInitialPlayerResponse":(\{.+?\}),/s
        ];

        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
                try {
                    // Clean up the JSON string
                    let jsonStr = match[1];
                    // Handle cases where the JSON might be cut off
                    const depth = { brace: 0 };
                    let endIndex = 0;
                    for (let i = 0; i < jsonStr.length; i++) {
                        if (jsonStr[i] === '{') depth.brace++;
                        if (jsonStr[i] === '}') depth.brace--;
                        if (depth.brace === 0) {
                            endIndex = i + 1;
                            break;
                        }
                    }
                    if (endIndex > 0) {
                        jsonStr = jsonStr.substring(0, endIndex);
                    }
                    playerResponse = JSON.parse(jsonStr);
                    break;
                } catch (e) {
                    console.log('Failed to parse pattern:', e.message);
                }
            }
        }

        if (!playerResponse) {
            // Try extracting from script tags more aggressively
            const scriptMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{".*?"playabilityStatus".*?\});/s);
            if (scriptMatch) {
                try {
                    playerResponse = JSON.parse(scriptMatch[1]);
                } catch (e) {
                    console.log('Aggressive parse failed:', e.message);
                }
            }
        }

        if (!playerResponse) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not extract video data. The video may be private, age-restricted, or unavailable.'
                })
            };
        }

        // Step 4: Extract caption tracks
        const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captions || captions.length === 0) {
            // No captions available - use AI fallback
            const GROQ_API_KEY = process.env.GROQ_API_KEY;
            if (GROQ_API_KEY) {
                const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a content analyst. Provide a detailed analysis of what a video likely contains based on its title.'
                            },
                            {
                                role: 'user',
                                content: `Analyze the YouTube video titled "${videoTitle}". Provide a comprehensive breakdown of likely content, main points, and key takeaways. Format it as a detailed content summary.`
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });

                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    const aiContent = aiData.choices[0]?.message?.content;
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            transcript: `⚠️ NO CAPTIONS AVAILABLE\n\nThis video does not have captions/subtitles enabled. Here's an AI-generated content analysis based on the title:\n\n${aiContent}`,
                            title: videoTitle,
                            isAIGenerated: true
                        })
                    };
                }
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'This video does not have captions enabled. Only videos with subtitles/CC can be transcribed.'
                })
            };
        }

        // Step 5: Find the best caption track (prefer English)
        let captionTrack = captions.find(c =>
            c.languageCode === 'en' ||
            c.languageCode === 'en-US' ||
            c.languageCode === 'en-GB'
        );

        // If no English, try any manual captions (not auto-generated)
        if (!captionTrack) {
            captionTrack = captions.find(c => c.kind !== 'asr');
        }

        // If still nothing, use the first available
        if (!captionTrack) {
            captionTrack = captions[0];
        }

        if (!captionTrack || !captionTrack.baseUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Could not find a valid caption track' })
            };
        }

        // Step 6: Fetch the actual captions
        const captionUrl = captionTrack.baseUrl;
        const captionResponse = await fetch(captionUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!captionResponse.ok) {
            throw new Error('Failed to fetch captions');
        }

        const captionXml = await captionResponse.text();

        // Step 7: Parse the XML captions
        // Captions are in format: <text start="0" dur="5.5">Caption text</text>
        const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
        const captionTexts = [];

        for (const match of textMatches) {
            let text = match[1];
            // Decode HTML entities
            text = text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(num))
                .replace(/\n/g, ' ');
            captionTexts.push(text);
        }

        if (captionTexts.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Could not parse caption content' })
            };
        }

        const transcript = captionTexts.join(' ').replace(/\s+/g, ' ').trim();

        // Step 8: Return the transcript
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                transcript,
                title: videoTitle,
                language: captionTrack.languageCode,
                captionKind: captionTrack.kind === 'asr' ? 'auto-generated' : 'manual'
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
