// Transcribe YouTube video using multiple methods
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

        console.log('Attempting to transcribe video:', videoId);

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

        // Method 1: Use the public transcript API
        try {
            const transcriptRes = await fetch(
                `https://www.searchapi.io/api/v1/search?engine=youtube_transcripts&video_id=${videoId}&api_key=demo`
            );
            if (transcriptRes.ok) {
                const data = await transcriptRes.json();
                if (data.transcripts && data.transcripts.length > 0) {
                    transcript = data.transcripts
                        .map(t => t.text)
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }
            }
        } catch (e) {
            console.log('Method 1 failed:', e.message);
        }

        // Method 2: Try kome.ai transcript API
        if (!transcript) {
            try {
                const komeRes = await fetch(
                    `https://kome.ai/api/transcript?url=https://www.youtube.com/watch?v=${videoId}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                if (komeRes.ok) {
                    const komeData = await komeRes.json();
                    if (komeData.transcript) {
                        transcript = komeData.transcript;
                    }
                }
            } catch (e) {
                console.log('Method 2 failed:', e.message);
            }
        }

        // Method 3: Use Groq AI to generate a summary/content based on video ID
        // This serves as a fallback when transcripts aren't available
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
                                    content: 'You are a helpful assistant that provides information about YouTube videos based on their titles and context.'
                                },
                                {
                                    role: 'user',
                                    content: `I'm trying to analyze a YouTube video titled "${videoTitle}" (Video ID: ${videoId}). 
                                    
Since I couldn't retrieve the transcript, please provide:
1. What this video is likely about based on the title
2. Key topics that would typically be covered
3. A suggested structure for similar content

Format your response as if it were a transcript summary. Be helpful and informative.`
                                }
                            ],
                            temperature: 0.7,
                            max_tokens: 1500
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
                                    transcript: `[AI-Generated Analysis - Transcript not available]\n\n${aiContent}`,
                                    title: videoTitle,
                                    isAIGenerated: true
                                })
                            };
                        }
                    }
                } catch (e) {
                    console.log('AI fallback failed:', e.message);
                }
            }
        }

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Could not fetch transcript. The video may not have captions, or captions are disabled. Try a different video with manual captions.'
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
