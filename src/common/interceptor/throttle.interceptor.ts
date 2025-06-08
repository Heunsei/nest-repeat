import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Observable, tap } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly refletor: Reflector,
  ) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    // URL_USERID_MINUTE -> 어떤 url에 특정 사용자가 요청을 얼마나 보냇는지

    const userId = req?.user?.sub;

    if (!userId) {
      return next.handle();
    }

    const throttleOption = this.refletor.get<{
      count: number;
      unit: 'minute';
    }>(Throttle, context.getHandler());

    if (!throttleOption) {
      return next.handle();
    }

    const date = new Date();
    const min = date.getMinutes();

    const key = `${req.method}_${req.path}_${userId}_${min}`;

    const count = await this.cacheManager.get<number>(key);

    // console.log(key);
    // console.log(count);

    if (count && count >= throttleOption.count) {
      throw new ForbiddenException('요청 가능 횟수를 넘어섰습니다');
    }

    return next.handle().pipe(
      tap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;

        await this.cacheManager.set(key, count + 1, 60000);
      }),
    );
  }
}
