import { ApiError } from "../utils/ApiError.js";

export const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            message: err.message,
            success: false,
            data: null,
            errors: err.errors || null
        });
    }

    return res.status(500).json({
        statusCode: 500,
        message: err.message || "Internal Server Error",
        success: false,
        data: null
    });
};
