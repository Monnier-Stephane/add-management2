import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { SubscriptionsModule } from './subscriptions.module';
import { getModelToken } from '@nestjs/mongoose';

describe('SubscriptionsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule.register({ isGlobal: true }), SubscriptionsModule],
    })
      .overrideProvider(getModelToken('Subscription'))
      .useValue({})
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should compile successfully', () => {
    expect(module).toBeInstanceOf(TestingModule);
  });
});
