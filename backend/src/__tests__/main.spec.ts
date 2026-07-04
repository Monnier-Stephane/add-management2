jest.mock('../auth/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

jest.mock('../auth/firebase-admin', () => ({
  getFirebaseAdmin: jest.fn(),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

jest.mock('@nestjs/core', () => {
  const actual =
    jest.requireActual<typeof import('@nestjs/core')>('@nestjs/core');
  return {
    ...actual,
    NestFactory: {
      create: jest.fn(),
    },
  };
});

const originalEnv = process.env;

describe('Main Bootstrap', () => {
  let mockApp: {
    enableCors: jest.Mock;
    listen: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create app and enable CORS', async () => {
    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith('3001', '0.0.0.0');
  });

  it('should include FRONTEND_URL in CORS origins', async () => {
    process.env.FRONTEND_URL = 'https://add-management2.vercel.app/';

    const { bootstrap, getCorsOrigins } = await import('../main');

    await bootstrap();

    const corsConfig = mockApp.enableCors.mock.calls[0][0] as {
      origin: string[];
    };
    expect(corsConfig.origin).toEqual(getCorsOrigins());
    expect(corsConfig.origin).toContain('https://add-management2.vercel.app');
  });

  it('should use custom port from environment', async () => {
    process.env.PORT = '4000';

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('4000', '0.0.0.0');
  });

  it('should handle app creation errors', async () => {
    const error = new Error('App creation failed');
    (NestFactory.create as jest.Mock).mockRejectedValue(error);

    const { bootstrap } = await import('../main');

    await expect(bootstrap()).rejects.toThrow('App creation failed');
  });

  it('should handle listen errors', async () => {
    const error = new Error('Listen failed');
    mockApp.listen.mockRejectedValue(error);

    const { bootstrap } = await import('../main');

    await expect(bootstrap()).rejects.toThrow('Listen failed');
  });

  it('should handle undefined port environment variable', async () => {
    delete process.env.PORT;

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001, '0.0.0.0');
  });

  it('should handle empty port environment variable', async () => {
    process.env.PORT = '';

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('', '0.0.0.0');
  });

  it('should handle null port environment variable', async () => {
    process.env.PORT = null as unknown as string;

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001, '0.0.0.0');
  });

  it('should handle undefined port environment variable with nullish coalescing', async () => {
    process.env.PORT = undefined as unknown as string;

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001, '0.0.0.0');
  });
});
