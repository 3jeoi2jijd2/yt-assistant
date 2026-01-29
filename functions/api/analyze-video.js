// Cloudflare Pages Function: Analyze Video with REAL Transcript

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { videoUrl, question } = await context.request.json();
        const youtubeKey = context.env.YOUTUBE_API_KEY;
        const groqKey = context.env.GROQ_API_KEY;

        if (!youtubeKey) {
            return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // Extract video ID
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL. Supported: youtube.com/watch, youtube.com/shorts, youtu.be' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Get video details
        const videoRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeKey}`
        );
        const videoData = await videoRes.json();

        if (!videoData.items?.length) {
            return new Response(JSON.stringify({ error: 'Video not found' }), {
                status: 404,
                headers: corsHeaders
            });
        }

        const video = videoData.items[0];
        const videoInfo = {
            id: videoId,
            title: video.snippet.title,
            channel: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
            views: parseInt(video.statistics.viewCount) || 0,
            likes: parseInt(video.statistics.likeCount) || 0,
            comments: parseInt(video.statistics.commentCount) || 0,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            tags: video.snippet.tags || []
        };

        // FETCH REAL TRANSCRIPT
        let transcript = null;
        let transcriptText = '';

        try {
            // Try to get YouTube auto-generated captions via the timedtext API
            const transcriptRes = await fetch(
                `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`
            );

            if (transcriptRes.ok) {
                const transcriptData = await transcriptRes.json();

                if (transcriptData.events) {
                    // Parse the transcript events into readable text
                    transcript = transcriptData.events
                        .filter(e => e.segs && e.segs.length > 0)
                        .map(event => {
                            const startMs = event.tStartMs || 0;
                            const startSec = Math.floor(startMs / 1000);
                            const minutes = Math.floor(startSec / 60);
                            const seconds = startSec % 60;
                            const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            const text = event.segs.map(s => s.utf8 || '').join('').trim();
                            return { timestamp, text, startMs };
                        })
                        .filter(e => e.text);

                    // Create full text version
                    transcriptText = transcript.map(t => t.text).join(' ');
                }
            }

            // Fallback: Try alternative endpoint
            if (!transcript) {
                const altRes = await fetch(
                    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`
                );

                if (altRes.ok) {
                    const xmlText = await altRes.text();
                    // Parse XML transcript
                    const textMatches = xmlText.match(/<text[^>]*>([\s\S]*?)<\/text>/g);
                    if (textMatches) {
                        transcript = textMatches.map((match, i) => {
                            const startMatch = match.match(/start="([\d.]+)"/);
                            const textContent = match.replace(/<[^>]+>/g, '').trim();
                            const startSec = startMatch ? parseFloat(startMatch[1]) : i * 5;
                            const minutes = Math.floor(startSec / 60);
                            const seconds = Math.floor(startSec % 60);
                            return {
                                timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                                text: decodeHTMLEntities(textContent),
                                startMs: startSec * 1000
                            };
                        }).filter(t => t.text);

                        transcriptText = transcript.map(t => t.text).join(' ');
                    }
                }
            }
        } catch (e) {
            console.log('Transcript fetch error:', e.message);
        }

        // AI Analysis
        let analysis = null;
        let chatResponse = null;

        if (groqKey) {
            const engagementRate = videoInfo.views > 0 ? ((videoInfo.likes / videoInfo.views) * 100).toFixed(2) : 0;

            // If user asked a question, answer it using the transcript
            if (question) {
                const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${groqKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            {
                                role: 'system',
                                content: `You are an expert video analyst. Answer questions about this video using the transcript and metadata provided.

VIDEO INFO:
Title: ${videoInfo.title}
Channel: ${videoInfo.channel}
Views: ${formatNumber(videoInfo.views)}
Engagement: ${engagementRate}%

TRANSCRIPT:
${transcriptText.substring(0, 8000) || 'Transcript not available'}`
                            },
                            { role: 'user', content: question }
                        ],
                        temperature: 0.7,
                        max_tokens: 800
                    })
                });

                const chatData = await chatRes.json();
                chatResponse = chatData.choices?.[0]?.message?.content;
            }

            // Full analysis using real transcript
            const analysisPrompt = transcriptText
                ? `Analyze this video using the REAL transcript:

TITLE: ${videoInfo.title}
CHANNEL: ${videoInfo.channel}
VIEWS: ${formatNumber(videoInfo.views)}
ENGAGEMENT: ${engagementRate}%

FULL TRANSCRIPT (first 8000 chars):
${transcriptText.substring(0, 8000)}`
                : `Analyze based on metadata only:

TITLE: ${videoInfo.title}
CHANNEL: ${videoInfo.channel}  
VIEWS: ${formatNumber(videoInfo.views)}
ENGAGEMENT: ${engagementRate}%
DESCRIPTION: ${videoInfo.description.substring(0, 1500)}`;

            const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `Analyze this YouTube video and return JSON:
{
  "viralScore": 85,
  "hookAnalysis": "Analysis of the opening hook",
  "contentStructure": "How the video is structured",
  "whyItWorks": ["reason1", "reason2", "reason3"],
  "viralFormulas": ["formula: explanation"],
  "lessonsForCreators": ["lesson1", "lesson2", "lesson3"],
  "keyMoments": ["moment1", "moment2", "moment3"],
  "audienceInsight": "Who watches this and why"
}`
                        },
                        { role: 'user', content: analysisPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1200
                })
            });

            const aiData = await aiRes.json();
            const aiContent = aiData.choices?.[0]?.message?.content || '';

            try {
                const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
                analysis = { viralScore: 75, hookAnalysis: 'Analysis pending', whyItWorks: [], lessonsForCreators: [] };
            }
        }

        return new Response(JSON.stringify({
            video: {
                ...videoInfo,
                views: formatNumber(videoInfo.views),
                likes: formatNumber(videoInfo.likes),
                comments: formatNumber(videoInfo.comments),
                viewsRaw: videoInfo.views,
                likesRaw: videoInfo.likes
            },
            hasTranscript: !!transcript && transcript.length > 0,
            transcript,  // Full transcript with timestamps
            transcriptText, // Plain text version
            analysis,
            chatResponse
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Video analysis error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

function extractVideoId(url) {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
        /(?:youtu\.be\/)([^&\n?#]+)/,
        /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
        /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function decodeHTMLEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#32;': ' '
    };
    return text.replace(/&[#\w]+;/g, match => entities[match] || match);
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
