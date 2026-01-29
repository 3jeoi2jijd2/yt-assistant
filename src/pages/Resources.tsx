import { Wrench, Link, FileText, ArrowRight, ExternalLink } from 'lucide-react';

export default function Resources() {
    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <Wrench size={32} style={{ color: 'var(--accent-primary)' }} />
                    Creator Resources
                </h1>
                <p>Essential tools and workflows to supercharge your content creation</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Transcript Tools */}
                <div className="card col-span-2">
                    <div className="flex items-start gap-4">
                        <div style={{
                            background: 'var(--bg-tertiary)',
                            padding: '1rem',
                            borderRadius: '0.75rem'
                        }}>
                            <FileText size={32} style={{ color: 'var(--accent-red)' }} />
                        </div>
                        <div>
                            <h2 className="card-title mb-2">How to Get Transcripts (for free)</h2>
                            <p className="text-muted mb-4">
                                Use these trusted external tools to grab transcripts from any YouTube video,
                                then paste them into our AI tools for repurposing.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <a
                                    href="https://downsub.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="card hover-effect"
                                    style={{ background: 'var(--bg-tertiary)', display: 'block' }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold">DownSub</span>
                                        <ExternalLink size={16} />
                                    </div>
                                    <p className="text-sm text-muted"> reliably downloads SRT/TXT for any video.</p>
                                </a>

                                <a
                                    href="https://youtubetranscript.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="card hover-effect"
                                    style={{ background: 'var(--bg-tertiary)', display: 'block' }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold">YouTubeTranscript</span>
                                        <ExternalLink size={16} />
                                    </div>
                                    <p className="text-sm text-muted">Quick formatting for reading.</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Tip */}
                <div className="card">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                        <Link size={20} style={{ color: 'var(--accent-yellow)' }} />
                        The "Remix" Workflow
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <span className="badge badge-blue">1</span>
                            <p className="text-sm">Get the transcript using the tools above.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="badge badge-blue">2</span>
                            <p className="text-sm">Go to <strong>Script Generator</strong>.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="badge badge-blue">3</span>
                            <p className="text-sm">Use this prompt: <em>"Rewrite this transcript into a viral short script:"</em> [PASTE]</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="badge badge-blue">4</span>
                            <p className="text-sm">Boom. Viral remix ready.</p>
                        </div>
                    </div>
                </div>

                {/* More Tools */}
                <div className="card">
                    <h3 className="card-title flex items-center gap-2 mb-4">
                        <Wrench size={20} style={{ color: 'var(--accent-green)' }} />
                        Other Useful Tools
                    </h3>
                    <ul className="space-y-3">
                        <li>
                            <a href="https://thumbsup.tv" target="_blank" className="flex items-center gap-2 hover:text-[var(--accent-primary)]">
                                <ArrowRight size={16} /> ThumbsUp.tv (Thumbnail Preview)
                            </a>
                        </li>
                        <li>
                            <a href="https://trends.google.com" target="_blank" className="flex items-center gap-2 hover:text-[var(--accent-primary)]">
                                <ArrowRight size={16} /> Google Trends
                            </a>
                        </li>
                        <li>
                            <a href="https://answe.re" target="_blank" className="flex items-center gap-2 hover:text-[var(--accent-primary)]">
                                <ArrowRight size={16} /> AnswerThePublic (Topic Research)
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
