import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from './types';
import './types';

export async function authPlugin(app: FastifyInstance) {
    // Adds custom methods to the Fastify instance.
    // This method can now be used anywhere in your app as app.authenticate
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'No token provided',
        });
      }

      const decoded = await request.server.jwt.verify<JwtPayload>(token);
      
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

