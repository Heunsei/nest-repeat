import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('test') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'test') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  // validate : username, password
  // return -> Request();
  async validate(email: string, passsword: string) {
    const user = await this.authService.authenticate(email, passsword);
    return user;
  }
}
