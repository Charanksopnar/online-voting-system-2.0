
import React, { useEffect, useState, useRef } from 'react';
import { logger, LogEntry } from '../../services/loggerService';
import { Terminal, ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';

export const LogConsole: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = logger.subscribe((entry) => {
            setLogs(prev => [...prev].slice(-50).concat(entry));
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-full shadow-2xl z-50 hover:bg-gray-800 transition-all border border-gray-700"
            >
                <Terminal size={20} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-gray-900 rounded-xl shadow-2xl z-50 border border-gray-700 overflow-hidden flex flex-col transition-all duration-300 transform scale-100 origin-bottom-right">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                    <Terminal size={14} className="text-primary-400" />
                    <span>System Backend Logs</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => {
                            logger.clear();
                            setLogs([]);
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-red-400 transition"
                        title="Clear logs"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Logs Area */}
            <div
                ref={scrollRef}
                className="p-3 h-64 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >
                {logs.length === 0 ? (
                    <div className="text-gray-600 italic text-center py-10">Waiting for system events...</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-2 group">
                            <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                            <span className={`shrink-0 font-bold ${log.level === 'SUCCESS' ? 'text-emerald-400' :
                                    log.level === 'ERROR' ? 'text-red-400' :
                                        log.level === 'WARNING' ? 'text-amber-400' :
                                            log.level === 'DEBUG' ? 'text-purple-400' : 'text-blue-400'
                                }`}>
                                {log.level.padEnd(7)}
                            </span>
                            <div className="flex-1">
                                <span className="text-gray-400 font-bold mr-1">[{log.source}]</span>
                                <span className="text-gray-200">{log.message}</span>
                                {log.details && (
                                    <pre className="mt-1 text-gray-500 whitespace-pre-wrap bg-black/30 p-1.5 rounded border border-white/5 overflow-x-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-900 px-4 py-1.5 border-t border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">DeepFace Engine Active</span>
                </div>
                <span className="text-[10px] text-gray-600">{logs.length} entries</span>
            </div>
        </div>
    );
};
