import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

// Mock NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

// Mock process.env
const originalEnv = process.env;

describe('Main Bootstrap', () => {
  let mockApp: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    // Reset process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create app and enable CORS', async () => {
    // Import and execute the bootstrap function
    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.enableCors).toHaveBeenCalled();
    expect(mockApp.listen).toHaveBeenCalledWith(3001); // Default port
  });

  it('should use custom port from environment', async () => {
    process.env.PORT = '4000';

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith('4000');
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

    expect(mockApp.listen).toHaveBeenCalledWith(3001); // Default port
  });

  it('should handle empty port environment variable', async () => {
    process.env.PORT = '';

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001); // Default port
  });

  it('should handle null port environment variable', async () => {
    process.env.PORT = null as any;

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001); // Default port
  });

  it('should handle undefined port environment variable with nullish coalescing', async () => {
    process.env.PORT = undefined as any;

    const { bootstrap } = await import('../main');

    await bootstrap();

    expect(mockApp.listen).toHaveBeenCalledWith(3001); // Default port
  });
});
