

class CustomError extends Error{
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode > 400 || statusCode < 500 ? 'fail' : 'error';
        Error.captureStackTrace(this,CustomError)
        
    }
}



export const errorHandler = (error, req, res, next) => {
  console.log(error)
  const message = error?.message || "Something went wrong";
  const statusCode = error?.statusCode || 500;
  const status = error?.status || "server_error";
  const success = error?.success || false;
  res.status(statusCode).json({
    message: message,
    status,
    success,
    data: null,
    originalError: process.env.NODE_ENV === "development" ? error.stack : null,
  });
};


export default CustomError