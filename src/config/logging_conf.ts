/**
 * Configuración avanzada de Winston para logging.
 * Incluye filtro para ofuscar emails y adaptación por entorno.
 */

import winston, { format, transports, Logger } from 'winston';
import { config } from './env_conf';

// Utilidad para ofuscar emails en los logs
function obfuscateEmails(msg: string, env: string): string {
  // Regex simple para emails
  return msg.replace(
    /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (_match, local, domain) => {
      if (env === 'dev') {
        // Solo muestra la primera letra y el dominio
        return `${local[0]}***@${domain}`;
      }
      // Producción y test: oculta todo el local-part
      return `***@${domain}`;
    }
  );
}

// Winston custom format para ofuscar emails
const emailObfuscationFormat = format((info) => {
  if (typeof info.message === 'string') {
    info.message = obfuscateEmails(info.message, config.ENV_STATE || 'dev');
  }
  if (info.stack && typeof info.stack === 'string') {
    info.stack = obfuscateEmails(info.stack, config.ENV_STATE || 'dev');
  }
  return info;
});

// Formato base para logs
const baseFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  emailObfuscationFormat(),
  format.errors({ stack: true }),
  format.splat(),
  format.printf(({ timestamp, level, message, stack }) => {
    return stack
      ? `[${timestamp}] [${level}] ${message}\n${stack}`
      : `[${timestamp}] [${level}] ${message}`;
  })
);

// Configuración de transportes por entorno
function getTransports(env: string) {
  if (env === 'production') {
    return [
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize(),
          baseFormat
        ),
      }),
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: baseFormat,
        maxsize: 1024 * 1024 * 5, // 5MB
        maxFiles: 5,
      }),
      new transports.File({
        filename: 'logs/combined.log',
        format: baseFormat,
        maxsize: 1024 * 1024 * 10, // 10MB
        maxFiles: 5,
      }),
      // Aquí puedes agregar transportes externos (Logtail, Sentry, etc.)
    ];
  }
  if (env === 'test') {
    return [
      new transports.Console({
        level: 'warn',
        silent: true, // Silencia logs en test por defecto
      }),
    ];
  }
  // development
  return [
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        baseFormat
      ),
    }),
  ];
}

// Instancia singleton del logger
const envConfig = config;

export const logger: Logger = winston.createLogger({
  level: envConfig.LOG_LEVEL,
  levels: winston.config.npm.levels,
  format: baseFormat,
  transports: getTransports(envConfig.ENV_STATE || 'dev'),
  exitOnError: false,
});

// Helper para usar el logger en toda la app
export default logger;
