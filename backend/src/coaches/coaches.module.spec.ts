/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { CoachesModule } from './coaches.module';
import { getModelToken } from '@nestjs/mongoose';

describe('CoachesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CoachesModule],
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
