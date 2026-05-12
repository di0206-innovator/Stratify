class HttpError extends Error {
    constructor(status, code, message, details) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function errorResponse(error, requestId) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = status >= 500 ? 'Internal server error.' : error.message;

    return {
        status,
        body: {
            message,
            details: error.details,
            error: {
                code,
                message,
                requestId,
                details: error.details
            }
        }
    };
}

module.exports = { HttpError, errorResponse };
