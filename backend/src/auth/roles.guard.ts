import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { CoachesService } from '../coaches/coaches.service';
  import { IS_PUBLIC_KEY } from './public.decorator';
  import { ROLES_KEY, AppRole } from './roles.decorator';
  
  @Injectable()
  export class RolesGuard implements CanActivate {
    constructor(
      private reflector: Reflector,
      private coachesService: CoachesService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      // 1. Route publique → on laisse passer
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) return true;
  
      const request = context.switchToHttp().getRequest<{
        user?: { uid: string; email?: string; statut?: AppRole; coachId?: string };
      }>();
  
      // 2. FirebaseAuthGuard doit avoir tourné avant
      if (!request.user?.email) {
        throw new UnauthorizedException('Utilisateur non authentifié');
      }
  
      // 3. Coach enregistré en base ?
      const coach = await this.coachesService.findByEmailForAuth(request.user.email);
      if (!coach) {
        throw new ForbiddenException('Accès refusé : compte non enregistré comme coach');
      }
  
      // 4. Enrichir request.user pour les controllers
      request.user.statut = coach.statut;
      request.user.coachId = coach.id;
  
      // 5. Rôles requis sur cette route ?
      const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
  
      // Pas de @Roles() → tout coach authentifié peut accéder
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
  
      if (!requiredRoles.includes(coach.statut)) {
        throw new ForbiddenException('Accès refusé : permissions insuffisantes');
      }
  
      return true;
    }
  }