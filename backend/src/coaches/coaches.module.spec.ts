import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { CoachesModule } from './coaches.module';
import { getModelToken } from '@nestjs/mongoose';

describe('CoachesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule.register({ isGlobal: true }), CoachesModule],
    })
      .overrideProvider(getModelToken('Coach'))
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
