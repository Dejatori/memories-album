import createHttpError from 'http-errors';
import { isZodError, isMongoError, isMongoServerError } from '../../types/errors';
import logger from '../../config/logging_conf';

export function handleServiceError(err: unknown, context: string) {
    if (isZodError(err)) {
        logger.warn(`Zod validation error in ${context}`, { errors: err.errors });
        throw createHttpError(400, 'Validation error', { errors: err.errors });
    }
    if (isMongoError(err)) {
        logger.warn(`Mongoose validation error in ${context}`, { err });
        throw createHttpError(400, err.message);
    }
    if (isMongoServerError(err)) {
        logger.warn(`MongoServerError in ${context}`, { err });
        throw createHttpError(409, 'Duplicate key error');
    }
    logger.error(`Unknown error in ${context}`, { err });
    throw err;
}