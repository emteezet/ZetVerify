/**
 * @class AppError
 * @description Base class for application-specific errors.
 */
export class AppError extends Error {
    constructor(message, code, statusCode = 400, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * error codes for the application
 */
export const ErrorCodes = {
    INSUFFICIENT_BALANCE: 'WALLET_001',
    TRANSACTION_FAILED: 'WALLET_002',
    IDENTITY_NOT_FOUND: 'IDENTITY_001',
    VERIFICATION_FAILED: 'IDENTITY_002',
    VALIDATION_ERROR: 'GEN_001',
    UNAUTHORIZED: 'AUTH_001',
    PLATFORM_ERROR: 'SYS_001',
};

export class WalletError extends AppError {
    constructor(message, code = ErrorCodes.TRANSACTION_FAILED) {
        super(message, code, 400);
    }
}

export class IdentityError extends AppError {
    constructor(message, code = ErrorCodes.VERIFICATION_FAILED) {
        super(message, code, 404);
    }
}

export class ValidationError extends AppError {
    constructor(message) {
        super(message, ErrorCodes.VALIDATION_ERROR, 422);
    }
}
