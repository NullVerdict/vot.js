import config from "../data/config";
import { LoggerLevel } from "../types/logger";

const prefix = `[vot.js v${config.version}]`;

function canLog(level: LoggerLevel) {
  return config.loggerLevel <= level;
}

function log(...messages: unknown[]) {
  if (!canLog(LoggerLevel.DEBUG)) {
    return;
  }

  console.log(prefix, ...messages);
}

function info(...messages: unknown[]) {
  if (!canLog(LoggerLevel.INFO)) {
    return;
  }

  console.info(prefix, ...messages);
}

function warn(...messages: unknown[]) {
  if (!canLog(LoggerLevel.WARN)) {
    return;
  }

  console.warn(prefix, ...messages);
}

function error(...messages: unknown[]) {
  if (!canLog(LoggerLevel.ERROR)) {
    return;
  }

  console.error(prefix, ...messages);
}

const Logger = {
  canLog,
  log,
  info,
  warn,
  error,
} as const;

export default Logger;
