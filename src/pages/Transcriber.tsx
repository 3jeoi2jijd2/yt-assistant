import { useState } from 'react';
import { Video, Sparkles, Copy, Check, Save, Clock, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { saveTranscript } from '../lib/supabase';

export default function Transcriber() {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [videoTitle, setVideoTitle] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const extractVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/shorts\/([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleTranscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setTranscript('');
        setAnalysis('');
        setVideoTitle('');
        setSaved(false);

        const videoId = extractVideoId(url);
        if (!videoId) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/.netlify/functions/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch transcript');
            }

            setTranscript(data.transcript);
            setVideoTitle(data.title || 'YouTube Video');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!transcript) return;

        setAnalyzing(true);
        setAnalysis('');

        try {
            const response = await fetch('/.netlify/functions/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to analyze transcript');
            }

            setAnalysis(data.analysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze transcript');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!user || !transcript) return;

        const videoId = extractVideoId(url);
        if (!videoId) return;

        const { error } = await saveTranscript(user.id, videoId, videoTitle, transcript);
        if (!error) {
            setSaved(true);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Video size={32} style={{ color: 'var(--accent-youtube)' }} />
                    YouTube Transcriber
                </h1>
                <p>Extract transcripts from any YouTube video and analyze with AI</p>
            </div>

            <div className="card mb-6">
                <form onSubmit={handleTranscribe}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label className="form-label">YouTube Video URL</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? (
                            <>
                                <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                Fetching Transcript...
                            </>
                        ) : (
                            <>
                                <Video size={20} />
                                Get Transcript
                            </>
                        )}
                    </button>
                </form>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {transcript && (
                <div className="card mb-6 animate-slideUp">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">{videoTitle}</h3>
                            <p className="text-sm text-muted mt-1">
                                <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                {transcript.split(' ').length} words
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCopy(transcript)}
                                className="btn btn-secondary btn-sm"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-secondary btn-sm"
                                disabled={saved}
                            >
                                <Save size={16} />
                                {saved ? 'Saved!' : 'Save'}
                            </button>
                            <button
                                onClick={handleAnalyze}
                                className="btn btn-primary btn-sm"
                                disabled={analyzing}
                            >
                                {analyzing ? (
                                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                AI Analyze
                            </button>
                        </div>
                    </div>
                    <div className="transcript-container">
                        {transcript}
                    </div>
                </div>
            )}

            {analysis && (
                <div className="card animate-slideUp">
                    <div className="card-header">
                        <h3 className="card-title flex items-center gap-2">
                            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                            AI Analysis
                        </h3>
                        <button
                            onClick={() => handleCopy(analysis)}
                            className="btn btn-secondary btn-sm"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                    </div>
                    <div className="script-content" style={{ whiteSpace: 'pre-wrap' }}>
                        {analysis}
                    </div>
                </div>
            )}

            {!transcript && !loading && (
                <div className="card">
                    <div className="empty-state">
                        <FileText size={64} />
                        <h3>No Transcript Yet</h3>
                        <p>Enter a YouTube URL above to extract the video transcript</p>
                    </div>
                </div>
            )}
        </div>
    );
}
