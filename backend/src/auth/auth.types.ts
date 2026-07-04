import { AppRole } from './roles.decorator';

export interface AuthUser {
  uid: string;
  email: string;
  statut: AppRole;
  coachId: string;
}