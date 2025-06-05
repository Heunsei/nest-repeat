/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { NextFunction, Request, Response } from 'express';
import { envVariablesKeys } from 'src/common/const/env.const';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    // token이 들어옴
    const authHeader = req.headers['authorization'];
    // 인증 의도가 없는 경우
    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰입니다');
    }

    const tokenKey = `TOKEN_${token}`;

    const cachedPayload = await this.cacheManager.get(tokenKey);

    if (cachedPayload) {
      req.user = cachedPayload;

      return next();
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰입니다');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariablesKeys.refreshTokenSecret
          : envVariablesKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      const expiryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();

      const diffInSeconds = (expiryDate - now) / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((diffInSeconds - 30) * 1000, 1),
      );

      // 토큰이 있다면 payload를 request 객체를 담아줌.
      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다');
      }
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const bearerSplit = rawToken.split(' ');

    if (bearerSplit.length !== 2) {
      throw new BadRequestException('토큰의 포맷이 잘못되었습니다');
    }

    const [bearer, token] = bearerSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰의 포맷이 잘못되었습니다');
    }

    return token;
  }
}
