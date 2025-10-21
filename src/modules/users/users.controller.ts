import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service';
import { env } from '../../config/env';
import '../../auth/types';

export class UsersController {
  private service: UsersService;

  constructor() {
    this.service = new UsersService();
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password } = request.body as { email: string; password: string };

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required',
        });
      }

      const { user } = await this.service.register(email, password);

      return reply.status(201).send({
        success: true,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { email, password } = request.body as { email: string; password: string };

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required',
        });
      }

      const user = await this.service.login(email, password);

      const token = request.server.jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        { expiresIn: env.jwtExpiresIn }
      );

      return reply.status(200).send({
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error: any) {
      return reply.status(401).send({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }
}

