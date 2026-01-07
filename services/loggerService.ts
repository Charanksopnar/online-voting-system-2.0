
type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    source: string;
    message: string;
    details?: any;
}

type LogListener = (entry: LogEntry) => void;

class LoggerService {
    private listeners: Set<LogListener> = new Set();
    private logs: LogEntry[] = [];
    private maxLogs = 100;

    subscribe(listener: LogListener) {
        this.listeners.add(listener);
        // Provide existing logs to new listener
        this.logs.forEach(listener);
        return () => this.listeners.delete(listener);
    }

    log(level: LogLevel, source: string, message: string, details?: any) {
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toLocaleTimeString(),
            level,
            source,
            message,
            details
        };

        console.log(`[${entry.level}] [${entry.source}] ${entry.message}`, details || '');

        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.listeners.forEach(listener => listener(entry));
    }

    info(source: string, message: string, details?: any) {
        this.log('INFO', source, message, details);
    }

    success(source: string, message: string, details?: any) {
        this.log('SUCCESS', source, message, details);
    }

    warning(source: string, message: string, details?: any) {
        this.log('WARNING', source, message, details);
    }

    error(source: string, message: string, details?: any) {
        this.log('ERROR', source, message, details);
    }

    debug(source: string, message: string, details?: any) {
        this.log('DEBUG', source, message, details);
    }

    async persistLocally(userName: string, type: string, payload: any) {
        try {
            const response = await fetch('/local-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName,
                    type,
                    timestamp: new Date().toISOString(),
                    payload
                })
            });
            const result = await response.json();
            this.debug('Logger', `Local log persisted: ${result.path || 'error'}`);
        } catch (err) {
            console.error('Failed to persist log locally:', err);
        }
    }

    async getLocalBackup(userName: string) {
        try {
            const response = await fetch(`/local-logs?user=${encodeURIComponent(userName)}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.warn('Could not fetch local backup:', err);
        }
        return null;
    }

    getLogs() {
        return [...this.logs];
    }

    clear() {
        this.logs = [];
        // Notify listeners with empty or pulse?
    }
}

export const logger = new LoggerService();
