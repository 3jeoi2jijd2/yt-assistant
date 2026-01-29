// Cloudflare Pages Function: Analyze Video with Recreation Guide

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
            thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
            views: parseInt(video.statistics.viewCount) || 0,
            likes: parseInt(video.statistics.likeCount) || 0,
            comments: parseInt(video.statistics.commentCount) || 0,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            tags: video.snippet.tags || []
        };

        // AI Analysis with Recreation Steps
        let analysis = null;
        let chatResponse = null;

        if (groqKey) {
            const engagementRate = videoInfo.views > 0 ? ((videoInfo.likes / videoInfo.views) * 100).toFixed(2) : 0;

            // If user asked a question
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
                                content: `You are an expert video analyst helping creators recreate viral videos. The video is "${videoInfo.title}" by ${videoInfo.channel} with ${formatNumber(videoInfo.views)} views. Answer the user's question with specific, actionable advice.`
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

            // Full analysis with recreation guide
            const analysisPrompt = `Analyze this YouTube video and provide a RECREATION GUIDE:

TITLE: ${videoInfo.title}
CHANNEL: ${videoInfo.channel}
VIEWS: ${formatNumber(videoInfo.views)}
LIKES: ${formatNumber(videoInfo.likes)}
ENGAGEMENT: ${engagementRate}%
DESCRIPTION: ${videoInfo.description.substring(0, 2000)}
TAGS: ${videoInfo.tags.slice(0, 10).join(', ')}

Analyze WHY this video went viral and provide step-by-step instructions to recreate similar content.`;

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
                            content: `You are a YouTube expert. Analyze videos and provide actionable recreation guides. Return JSON only:

{
  "viralScore": 85,
  "hookAnalysis": "Detailed analysis of the opening hook (first 5 seconds)",
  "contentStructure": "How the video is structured for retention",
  "whyItWorks": ["reason 1 - be specific", "reason 2", "reason 3"],
  "viralFormulas": ["Curiosity Gap", "Pattern Interrupt", "Emotional Trigger"],
  "lessonsForCreators": ["actionable lesson 1", "lesson 2", "lesson 3"],
  "keyMoments": ["key moment 1", "moment 2", "moment 3"],
  "audienceInsight": "Who watches this and why",
  "recreationSteps": [
    "Step 1: Research and script - write a hook that...",
    "Step 2: Set up your filming location with...",
    "Step 3: Record multiple takes focusing on...",
    "Step 4: Edit using cuts every 2-3 seconds...",
    "Step 5: Add music/sound effects that...",
    "Step 6: Create a thumbnail with...",
    "Step 7: Write title using [formula]...",
    "Step 8: Post at [optimal time] and..."
  ],
  "equipmentNeeded": ["Smartphone/Camera", "Ring Light", "Microphone", "Tripod", "Editing Software"],
  "difficulty": "Easy/Medium/Hard",
  "estimatedBudget": "$0-50 / $50-200 / $200+"
}`
                        },
                        { role: 'user', content: analysisPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500
                })
            });

            const aiData = await aiRes.json();
            const aiContent = aiData.choices?.[0]?.message?.content || '';

            try {
                const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
                analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch (e) {
                analysis = {
                    viralScore: 75,
                    hookAnalysis: 'Analysis pending',
                    whyItWorks: ['High production value', 'Engaging topic', 'Strong hook'],
                    viralFormulas: ['Curiosity Gap'],
                    lessonsForCreators: ['Study the hook', 'Match the pacing', 'Use similar formatting'],
                    recreationSteps: [
                        'Watch the video multiple times and take notes',
                        'Identify the hook and structure',
                        'Write your own script inspired by the format',
                        'Film with similar framing and energy',
                        'Edit with matching pacing and cuts',
                        'Create eye-catching thumbnail',
                        'Craft clickable title using similar patterns',
                        'Post and engage with comments'
                    ],
                    equipmentNeeded: ['Camera/Phone', 'Good Lighting', 'Microphone'],
                    difficulty: 'Medium',
                    estimatedBudget: '$50-200'
                };
            }
        }

        return new Response(JSON.stringify({
            video: {
                ...videoInfo,
                views: formatNumber(videoInfo.views),
                likes: formatNumber(videoInfo.likes),
                comments: formatNumber(videoInfo.comments)
            },
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

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
