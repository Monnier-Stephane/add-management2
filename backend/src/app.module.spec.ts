jest.mock('./auth/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('./auth/firebase-admin', () => ({
  getFirebaseAdmin: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('./database/database.module', () => ({
  DatabaseModule: class DatabaseModule {},
}));

jest.mock('./subscriptions/subscriptions.module', () => ({
  SubscriptionsModule: class SubscriptionsModule {},
}));

jest.mock('./coaches/coaches.module', () => ({
  CoachesModule: class CoachesModule {},
}));

jest.mock('./planning/planning.module', () => ({
  PlanningModule: class PlanningModule {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should compile successfully', () => {
    expect(module).toBeInstanceOf(TestingModule);
  });
});
