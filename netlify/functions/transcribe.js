// Transcribe YouTube video using multiple reliable methods
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

        console.log('Fetching transcript for video:', videoId);

        // Get video title first using oembed (no API key needed)
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
            console.log('Could not fetch video title via oembed');
        }

        let transcript = null;

        // Method 1: Try Tactiq's free transcript service
        try {
            const tactiqRes = await fetch(`https://tactiq-apps-prod.tactiq.io/transcript`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ videoId })
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
            console.log('Tactiq method failed:', e.message);
        }

        // Method 2: Try YouTube's built-in timedtext endpoint
        if (!transcript) {
            try {
                // First get the video page to extract caption tracks
                const videoPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
                const videoPageHtml = await videoPageRes.text();

                // Extract caption track URL from the page
                const captionMatch = videoPageHtml.match(/"captionTracks":\[(.*?)\]/);
                if (captionMatch) {
                    try {
                        const captionData = JSON.parse('[' + captionMatch[1] + ']');
                        const englishCaption = captionData.find(c =>
                            c.languageCode === 'en' ||
                            c.languageCode === 'en-US' ||
                            c.languageCode === 'en-GB'
                        ) || captionData[0];

                        if (englishCaption && englishCaption.baseUrl) {
                            // Fetch the actual captions
                            const captionRes = await fetch(englishCaption.baseUrl + '&fmt=json3');
                            if (captionRes.ok) {
                                const captions = await captionRes.json();
                                if (captions.events) {
                                    transcript = captions.events
                                        .filter(e => e.segs)
                                        .map(e => e.segs.map(s => s.utf8 || '').join(''))
                                        .join(' ')
                                        .replace(/\s+/g, ' ')
                                        .trim();
                                }
                            }
                        }
                    } catch (parseErr) {
                        console.log('Failed to parse caption data:', parseErr.message);
                    }
                }
            } catch (e) {
                console.log('YouTube page method failed:', e.message);
            }
        }

        // Method 3: Use AI to analyze the video if no transcript available
        if (!transcript) {
            const GROQ_API_KEY = process.env.GROQ_API_KEY;
            if (GROQ_API_KEY) {
                try {
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
                                    content: `You are an expert content analyst. When a user provides a YouTube video title, you provide a comprehensive analysis of what the video likely contains based on the title, including:
- Main topic and key points that would be covered
- Typical structure for this type of content
- Key talking points and insights
- Relevant keywords and themes

Format the analysis as if it were a detailed summary/transcript of the video content.`
                                },
                                {
                                    role: 'user',
                                    content: `The YouTube video "${videoTitle}" (ID: ${videoId}) doesn't have accessible captions. Please provide a comprehensive analysis of what this video likely covers based on its title. Create a detailed content summary that can be used for reference.`
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 2000
                        })
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const aiContent = aiData.choices[0]?.message?.content;
                        if (aiContent) {
                            return {
                                statusCode: 200,
                                headers,
                                body: JSON.stringify({
                                    transcript: `📝 AI-GENERATED ANALYSIS (Captions not available)\n\n${aiContent}`,
                                    title: videoTitle,
                                    isAIGenerated: true,
                                    note: 'This video does not have accessible captions. We generated an AI analysis based on the title.'
                                })
                            };
                        }
                    }
                } catch (e) {
                    console.log('AI analysis failed:', e.message);
                }
            }
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. This video may not have captions enabled, or the captions are in a format we cannot access. Try a video with manually added English captions.'
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
