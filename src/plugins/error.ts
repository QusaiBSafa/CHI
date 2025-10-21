import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

/**
 * General error handler for the application.
 * It handles validation errors, JWT errors, MongoDB duplicate key errors, and default errors.
 * It logs the error and returns a response with the appropriate status code and message.
 * @param app 
 */
export async function errorPlugin(app: FastifyInstance) {
  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error
    request.log.error(error);

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        message: 'Validation error',
        errors: error.validation,
      });
    }

    // Handle JWT errors
    if (error.message.includes('jwt') || error.message.includes('token')) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication failed',
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.message.includes('duplicate key')) {
      return reply.status(409).send({
        success: false,
        message: 'Resource already exists',
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      message: error.message || 'Internal server error',
    });
  });
}

