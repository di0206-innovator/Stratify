class HttpError extends Error {
  /**
   * Creates a new HttpError.
   * @param {number} status - HTTP status code (e.g., 401, 404).
   * @param {string} code - Short error code identifier.
   * @param {string} message - Human‑readable error message.
   * @param {any} [details] - Detailed validation or context errors.
   */
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    // Preserve proper name for stack traces.
    this.name = this.constructor.name;
  }
}

/**
 * Formats an error into a standardized HTTP response payload.
 * @param {Error|any} err - The error object thrown in the application.
 * @param {string} requestId - The request identifier for tracing.
 * @returns {{status:number, body:{error:{code:string,message:string,requestId:string,details?:any}}}}
 */
function errorResponse(err, requestId) {
  const status = err && typeof err.status === 'number' ? err.status : 500;
  const code = err && err.code ? err.code : 'INTERNAL_ERROR';
  const message = err && err.message ? err.message : 'Internal server error';
  return {
    status,
    body: {
      error: {
        code,
        message,
        requestId,
        details: err && err.details ? err.details : undefined
      }
    }
  };
}

module.exports = { HttpError, errorResponse };
