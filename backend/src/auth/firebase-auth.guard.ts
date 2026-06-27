import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdmin } from './firebase-admin';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: { uid: string; email?: string };
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.slice(7);

    try {
      getFirebaseAdmin();
      const decoded = await getAuth().verifyIdToken(token);

      request.user = {
        uid: decoded.uid,
        email: decoded.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }
}