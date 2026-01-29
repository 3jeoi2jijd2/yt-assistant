// Cloudflare Pages Function: Get Transcript using YouTube API

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { videoUrl } = await context.request.json();
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
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
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
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails?.high?.url,
            views: parseInt(video.statistics.viewCount) || 0,
            likes: parseInt(video.statistics.likeCount) || 0,
            comments: parseInt(video.statistics.commentCount) || 0,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration
        };

        // Get captions list
        const captionsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${youtubeKey}`
        );
        const captionsData = await captionsRes.json();

        let transcript = null;
        let captionsAvailable = false;

        if (captionsData.items?.length > 0) {
            captionsAvailable = true;
            // Note: Actually downloading captions requires OAuth, so we'll use the description and AI
        }

        // Use AI to analyze the video based on title, description, and metadata
        let analysis = null;
        if (groqKey) {
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
                            content: `You are a viral content analyst. Analyze this YouTube video and provide insights. Return JSON:
{
  "viralScore": 85,
  "hookAnalysis": "Analysis of the title/thumbnail hook",
  "contentBreakdown": "What the video likely covers based on metadata",
  "whyItWorks": ["reason1", "reason2", "reason3"],
  "lessonsForCreators": ["lesson1", "lesson2", "lesson3"],
  "suggestedImprovements": ["improvement1", "improvement2"],
  "estimatedRetention": "Estimated viewer retention pattern",
  "audienceInsight": "Who watches this and why"
}`
                        },
                        {
                            role: 'user',
                            content: `Analyze this video:
TITLE: ${videoInfo.title}
CHANNEL: ${videoInfo.channel}
VIEWS: ${formatNumber(videoInfo.views)}
LIKES: ${formatNumber(videoInfo.likes)}
COMMENTS: ${formatNumber(videoInfo.comments)}
ENGAGEMENT RATE: ${((videoInfo.likes / videoInfo.views) * 100).toFixed(2)}%
DESCRIPTION: ${videoInfo.description.substring(0, 500)}
DURATION: ${videoInfo.duration}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            const aiData = await aiRes.json();
            const aiContent = aiData.choices?.[0]?.message?.content || '';

            try {
                const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
                analysis = null;
            }
        }

        return new Response(JSON.stringify({
            video: {
                ...videoInfo,
                views: formatNumber(videoInfo.views),
                likes: formatNumber(videoInfo.likes),
                comments: formatNumber(videoInfo.comments)
            },
            captionsAvailable,
            transcript,
            analysis
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Transcript error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
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
