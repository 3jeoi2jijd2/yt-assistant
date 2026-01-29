import { useState } from 'react';
import {
    FileText,
    Search,
    Copy,
    Check,
    Clock,
    Youtube,
    AlertCircle,
    Download
} from 'lucide-react';

interface TranscriptSegment {
    start: number;
    duration: number;
    text: string;
}

interface TranscriptData {
    videoId: string;
    title: string;
    language: string;
    fullText: string;
    transcript: TranscriptSegment[];
}

export default function Transcriber() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<TranscriptData | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [showTimestamps, setShowTimestamps] = useState(true);

    const handleTranscribe = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            setError('Please enter a YouTube URL');
            return;
        }

        setLoading(true);
        setError('');
        setData(null);

        try {
            const response = await fetch('/api/get-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch transcript');
            }

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!data) return;

        let textToCopy = '';

        if (showTimestamps) {
            textToCopy = data.transcript.map(s => {
                const time = new Date(s.start * 1000).toISOString().substr(11, 8);
                return `[${time}] ${s.text}`;
            }).join('\n');
        } else {
            textToCopy = data.fullText;
        }

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (seconds: number) => {
        return new Date(seconds * 1000).toISOString().substr(14, 5);
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <FileText size={32} style={{ color: 'var(--accent-red)' }} />
                    Smart Transcriber
                </h1>
                <p>Extract accurate transcripts from any YouTube video instantly</p>
            </div>

            {/* Input Section */}
            <div className="card mb-6">
                <form onSubmit={handleTranscribe}>
                    <div className="form-group mb-4">
                        <label className="form-label">YouTube Video URL</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Youtube
                                    size={20}
                                    style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-muted)'
                                    }}
                                />
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '3rem' }}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)', color: 'white' }}
                            >
                                {loading ? (
                                    <span className="loading-spinner" style={{ width: 20, height: 20 }} />
                                ) : (
                                    <>Get Transcript</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {error && (
                <div className="alert alert-error mb-4 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Results Section */}
            {data && (
                <div className="animate-slideUp">
                    <div className="card">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Youtube size={20} style={{ color: 'var(--accent-red)' }} />
                                    {data.title}
                                </h2>
                                <p className="text-sm text-muted">
                                    Language: <span className="uppercase">{data.language}</span> • {data.transcript.length} segments
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className={`btn btn-sm ${showTimestamps ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setShowTimestamps(!showTimestamps)}
                                >
                                    <Clock size={16} />
                                    {showTimestamps ? 'Hide Times' : 'Show Times'}
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy All'}
                                </button>
                            </div>
                        </div>

                        <div
                            className="bg-[var(--bg-tertiary)] p-4 rounded-lg overflow-y-auto"
                            style={{ maxHeight: '600px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        >
                            {showTimestamps ? (
                                <div className="space-y-2">
                                    {data.transcript.map((s, i) => (
                                        <div key={i} className="flex gap-4 hover:bg-[var(--bg-secondary)] p-1 rounded">
                                            <span className="text-muted select-none" style={{ minWidth: '50px' }}>
                                                [{formatTime(s.start)}]
                                            </span>
                                            <span>{s.text}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                                    {data.fullText}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
