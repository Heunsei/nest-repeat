import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariablesKeys } from 'src/common/const/env.const';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaService } from 'src/common/prisma.service';
@Injectable()
export class AuthService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheService: Cache,
    private readonly prisma: PrismaService,
  ) {}

  // Basic 토큰은 id:password 형태로 인코딩된 토큰을 받아
  // 디코드 후 회원가입에 사용
  parseBasicToken(rawToken: string) {
    const splited = rawToken.split(' ');

    if (splited.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }

    const [basic, token] = splited;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const splitedToken = decoded.split(':');

    if (splitedToken.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }

    const [email, password] = splitedToken;
    return { email, password };
  }

  // 여기서 사용되는 토큰은 jwt 토큰.
  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const token = this.validateToken(rawToken);
    try {
      // 토큰이 유효한지 확인하는 과정
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken
            ? envVariablesKeys.refreshTokenSecret
            : envVariablesKeys.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('refresh 토큰을 입력해주세요');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('access 토큰을 입력해주세요');
        }
      }
      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료되었습니다');
    }
  }

  validateToken(rawToken: string) {
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

  async authenticate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    // const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('존재하지 않는 유저입니다.');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다');
    }
    return user;
  }

  // rawToken -> "Basic $token"
  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    return this.userService.create({
      email,
      password,
    });
  }

  // 토큰을 만들어서 발급해주는 로직.
  // accessToken은 5분만 유지 refreshToken은 24시간 유지.
  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const refreshTokenSecret = this.configService.get<string>(
      envVariablesKeys.refreshTokenSecret,
    );

    const accessTokenSecret = this.configService.get<string>(
      envVariablesKeys.accessTokenSecret,
    );
    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      },
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }

  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);

    const expiryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();

    const diffInSeconds = (expiryDate - now) / 1000;

    await this.cacheService.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(diffInSeconds * 1000, 1),
    );

    return true;
  }
}
