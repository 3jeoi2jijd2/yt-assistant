// Cloudflare Pages Function: Analyze Video with Transcript support

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

        // Extract video ID - supports regular, shorts, and embed URLs
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL. Supported formats: youtube.com/watch, youtu.be, youtube.com/shorts' }), {
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

        // Try to get captions/transcript
        let transcript = null;
        let captionsAvailable = false;

        try {
            // Get captions list
            const captionsRes = await fetch(
                `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${youtubeKey}`
            );
            const captionsData = await captionsRes.json();

            if (captionsData.items?.length > 0) {
                captionsAvailable = true;
                // Find English captions
                const englishCaption = captionsData.items.find(c =>
                    c.snippet.language === 'en' || c.snippet.language?.startsWith('en')
                ) || captionsData.items[0];

                // Note: Actually downloading captions requires OAuth
                // We'll use the description and available info for analysis
            }
        } catch (e) {
            console.log('Captions error:', e.message);
        }

        // AI Analysis
        let analysis = null;
        let chatResponse = null;

        if (groqKey) {
            const engagementRate = videoInfo.views > 0 ? ((videoInfo.likes / videoInfo.views) * 100).toFixed(2) : 0;

            // If user asked a question, answer it
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
                                content: `You are an expert video analyst helping a creator understand this video. Answer questions based on the video metadata. Be specific and actionable.

VIDEO INFO:
Title: ${videoInfo.title}
Channel: ${videoInfo.channel}
Views: ${formatNumber(videoInfo.views)}
Likes: ${formatNumber(videoInfo.likes)}
Engagement: ${engagementRate}%
Duration: ${videoInfo.duration}
Tags: ${videoInfo.tags.slice(0, 10).join(', ')}
Description: ${videoInfo.description.substring(0, 1000)}`
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

            // Full analysis
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
                            content: `You are an elite viral content analyst. Analyze this video and return JSON:
{
  "viralScore": 85,
  "hookAnalysis": "How effective is the title/thumbnail as a hook",
  "contentStructure": "How the video is likely structured based on title/description",
  "whyItWorks": ["reason1", "reason2", "reason3"],
  "viralFormulas": ["formula name: explanation"],
  "lessonsForCreators": ["lesson1", "lesson2", "lesson3"],
  "suggestedImprovements": ["improvement1", "improvement2"],
  "estimatedRetention": "Retention pattern prediction",
  "audienceInsight": "Who watches this and why",
  "transcriptSummary": "Based on title/description, summarize what this video covers",
  "keyMoments": ["key moment/topic 1", "key moment/topic 2", "key moment/topic 3"]
}`
                        },
                        {
                            role: 'user',
                            content: `Analyze:
TITLE: ${videoInfo.title}
CHANNEL: ${videoInfo.channel}
VIEWS: ${formatNumber(videoInfo.views)}
LIKES: ${formatNumber(videoInfo.likes)}
COMMENTS: ${formatNumber(videoInfo.comments)}
ENGAGEMENT: ${engagementRate}%
DURATION: ${videoInfo.duration}
TAGS: ${videoInfo.tags.slice(0, 15).join(', ')}
DESCRIPTION: ${videoInfo.description.substring(0, 1500)}`
                        }
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
            captionsAvailable,
            transcript,
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

    // Handle different URL formats
    const patterns = [
        // Standard watch URL: youtube.com/watch?v=ID
        /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
        // Short URL: youtu.be/ID
        /(?:youtu\.be\/)([^&\n?#]+)/,
        // Embed URL: youtube.com/embed/ID
        /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
        // Shorts URL: youtube.com/shorts/ID
        /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
        // Just the ID
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

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
