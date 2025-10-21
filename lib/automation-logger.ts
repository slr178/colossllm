// Automation Logger - Persistent logging system for production

import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: number;
  level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN';
  message: string;
  aiNumber?: number;
}

class AutomationLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 500;
  private logFile = join(process.cwd(), 'logs', 'automation.json');

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      // Ensure logs directory exists
      const logsDir = join(process.cwd(), 'logs');
      if (!existsSync(logsDir)) {
        mkdirSync(logsDir, { recursive: true });
      }

      // Load existing logs
      if (existsSync(this.logFile)) {
        const data = readFileSync(this.logFile, 'utf-8');
        this.logs = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  log(message: string, level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN' = 'INFO', aiNumber?: number) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      aiNumber
    };

    this.logs.push(entry);

    // Keep only last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to disk periodically (every 10 logs)
    if (this.logs.length % 10 === 0) {
      this.saveLogs();
    }

    // Also log to console (server-side only)
    if (typeof window === 'undefined') {
      const prefix = aiNumber ? `[AI${aiNumber}]` : '[SYS]';
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${prefix} ${message}`);
    }
  }

  getLogs(limit?: number): LogEntry[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return this.logs;
  }

  clear() {
    this.logs = [];
    this.saveLogs();
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance (only on server-side)
let loggerInstance: AutomationLogger | null = null;

export function getLogger(): AutomationLogger {
  if (!loggerInstance) {
    loggerInstance = new AutomationLogger();
  }
  return loggerInstance;
}

export const logger = typeof window === 'undefined' ? getLogger() : {
  log: () => {},
  getLogs: () => [],
  clear: () => {},
  export: () => ''
} as any;

export type { LogEntry };
