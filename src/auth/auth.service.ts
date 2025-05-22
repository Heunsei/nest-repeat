import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  parseBasicToken(rawToken: string) {
    const splited = rawToken.split(' ');

    if (splited.length !== 2) {
      throw new BadRequestException('잘못된 토큰입니다');
    }

    const [_, token] = splited;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    const splitedToken = decoded.split(':');

    if (splitedToken.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못되었습니다');
    }

    const [email, password] = splitedToken;
    return { email, password };
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다');
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

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      throw new BadRequestException('이미 존재하는 이메일의 회원입니다');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>('HASH_ROUNDS') as number,
    );

    await this.userRepository.save({
      email,
      password: hash,
    });
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.authenticate(email, password);

    const refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );

    const accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );

    return {
      refreshToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'refresh',
        },
        {
          secret: refreshTokenSecret,
          expiresIn: '24h',
        },
      ),
      accessToken: await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          type: 'access',
        },
        {
          secret: accessTokenSecret,
          expiresIn: 300,
        },
      ),
    };
  }
}
