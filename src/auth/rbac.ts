import { FastifyRequest, FastifyReply } from 'fastify';
import './types';

export function requireRole(...allowedRoles: ('admin' | 'patient')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required',
        });
      }

      const decoded = await request.server.jwt.verify<any>(token);
      
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      if (!allowedRoles.includes(decoded.role)) {
        return reply.status(403).send({
          success: false,
          message: 'Access denied. Insufficient permissions.',
        });
      }
    } catch (error) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };
}

export const requireAuth = requireRole('admin', 'patient');
export const requireAdmin = requireRole('admin');
export const requirePatient = requireRole('patient');

