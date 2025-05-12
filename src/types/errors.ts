import { ZodIssue } from 'zod';
import mongoose from 'mongoose';
import { HttpError } from 'http-errors';

/**
 * Interfaz para errores de Zod
 */
export interface ZodValidationError extends Error {
    name: 'ZodError';
    errors: ZodIssue[];
}

/**
 * Interfaz para errores de MongoDB de clave duplicada
 */
export interface MongoServerError extends Error {
    name: 'MongoServerError';
    code?: number;
    keyValue?: Record<string, unknown>;
}

/**
 * Interfaz para errores de tokens JWT
 */
export interface JwtError extends Error {
    name: 'JsonWebTokenError' | 'TokenExpiredError' | 'NotBeforeError';
}

/**
 * Type guards para verificar tipos de errores
 */

export function isZodError(error: unknown): error is ZodValidationError {
    return error instanceof Error && error.name === 'ZodError';
}

export function isHttpError(error: unknown): error is HttpError {
    // Usa la función existente de http-errors o implementa tu propia lógica
    return error instanceof Error && 'statusCode' in error && 'expose' in error;
}

export function isMongoError(error: unknown): error is mongoose.Error {
    return error instanceof mongoose.Error;
}

export function isMongoServerError(error: unknown): error is MongoServerError {
    return error instanceof Error && error.name === 'MongoServerError';
}

export function isJwtError(error: unknown): error is JwtError {
    return (
        error instanceof Error &&
        ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)
    );
}