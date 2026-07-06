const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Terjadi kesalahan pada server';

  // Handle Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (err.code === 'P2002') {
      statusCode = 409; // Conflict
      const target = err.meta?.target || 'Data';
      message = `${target} sudah digunakan atau sudah ada di sistem.`;
    }
    // Record not found
    else if (err.code === 'P2025') {
      statusCode = 404; // Not Found
      message = 'Data yang diminta tidak ditemukan.';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400; // Bad Request
    message = 'Data yang dikirimkan tidak valid sesuai skema.';
  }

  // Handle Zod Validation Errors (jika lolos ke middleware)
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token tidak valid.';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token sudah kedaluwarsa.';
  }

  res.status(statusCode).json({
    error: true,
    message: message,
    statusCode: statusCode
  });
};

module.exports = errorHandler;
