type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: any;
}

export function log(level: LogLevel, message: string, meta?: Record<string, any>) {
  const logMessage: LogMessage = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
  };

  console[level](JSON.stringify(logMessage));
}