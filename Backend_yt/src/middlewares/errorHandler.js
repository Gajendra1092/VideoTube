import { ApiError } from "../utils/ApiErrors.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // If it's not an ApiError, convert it to one
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error.errors || [], error.stack);
    }

    // Log error for debugging
    console.error('Error:', {
        statusCode: error.statusCode,
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
    });

    // Send error response
    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errors: error.errors,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

export { errorHandler };
