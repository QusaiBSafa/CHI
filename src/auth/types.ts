export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'patient';
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: 'admin' | 'patient';
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: AuthenticatedUser;
  }
}

