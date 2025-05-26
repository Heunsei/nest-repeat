import { Reflector } from '@nestjs/core';

// decorator의 작업은 guard 에서 진행함.
export const Public = Reflector.createDecorator();
