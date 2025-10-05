type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV !== "production";
const levelOrder: LogLevel[] = ["debug", "info", "warn", "error"];
const currentLevel = isDev ? "debug" : "info";

const colors: Record<LogLevel, string> = {
  debug: "\x1b[34m", // blue
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const resetColor = "\x1b[0m";

function shouldLog(level: LogLevel): boolean {
  return levelOrder.indexOf(level) >= levelOrder.indexOf(currentLevel);
}

function formatMessage(level: LogLevel): string {
  const timestamp = new Date().toISOString();
  const label = level.toUpperCase().padEnd(5);
  const color = colors[level];

  return `${color}[${label}] ${timestamp}:${resetColor}`;
}

function log(level: LogLevel, ...message: unknown[]): void {
  if (!shouldLog(level)) return;

  const formatted = formatMessage(level);
  console[level](formatted, ...message);
}

export const logger = {
  debug: (...message: unknown[]) => log("debug", ...message),
  info: (...message: unknown[]) => log("info", ...message),
  warn: (...message: unknown[]) => log("warn", ...message),
  error: (...message: unknown[]) => log("error", ...message),
};
