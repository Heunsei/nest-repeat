import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // if Public 데코레이터가 있다면 bypass
    // Public 데코레이터를 가져올거다.
    // context -> 퍼블릭 데코레이터에 입력된 객체가 들어옴
    const isPublic = this.reflector.get(Public, context.getHandler());
    // public이 안붙어있으면 undefined 반환을 이용.
    if (isPublic) return true;
    // 요청에서 user 객체가 존재하는지 확인
    // 존재한다면 인증이 통과를 했다는 의미로 받아들일 수 있음.
    const request = context.switchToHttp().getRequest();
    // console.log(request.user);
    if (!request.user || request.user.type !== 'access') {
      // console.log('여기서 끊기나요?');
      return false;
    }
    return true;
  }
}
