import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { register } from 'module';
import { User } from 'src/user/entity/user.entity';
import { access } from 'fs';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  tokenBlock: jest.fn(),
  issueToken: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register user', () => {
      const token = 'Basic Token';
      const result = { id: 1, email: 'test@naver.com' };

      jest.spyOn(authService, 'register').mockResolvedValue(result as User);

      expect(authController.registerUser(token)).resolves.toEqual(result);
      expect(authService.register).toHaveBeenCalledWith(token);
    });
  });

  describe('loginUser', () => {
    it('should login a user', async () => {
      const token = 'Basic asdafas';
      const result = {
        refreshToken: 'mocked.refreshToken',
        accessToken: 'mocked.accessToken',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(result);

      expect(authController.loginUser(token)).resolves.toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(token);
    });
  });

  describe('blockToken', () => {
    it('should block token', () => {
      const token = 'Bearer testtoken';

      jest.spyOn(authService, 'tokenBlock').mockResolvedValue(true);

      expect(authController.blockToken(token)).resolves.toBe(true);
      expect(authService.tokenBlock).toHaveBeenCalledWith(token);
    });
  });

  describe('rotateAccessToken', () => {
    it('should rotate access token', async () => {
      const accessToken = 'mocked.access.token';

      jest.spyOn(authService, 'issueToken').mockResolvedValue(accessToken);

      const result = await authController.rotateAccessToken({ user: 'a' });

      expect(authService.issueToken).toHaveBeenCalledWith('a', false);
      expect(result).toEqual({ accessToken });
    });
  });

  describe('loginUserPassport', () => {
    it('should login user using passport strategy', async () => {
      const user = { id: 1, role: 'user' };
      const req = { user };

      const accessToken = 'mocked.access.token';
      const refreshToken = 'mocked.refresh.token';

      jest
        .spyOn(authService, 'issueToken')
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      const res = await authController.loginUserPassport(req);

      expect(authService.issueToken).toHaveBeenCalledTimes(2);
      expect(authService.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(authService.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(res).toEqual({ refreshToken, accessToken });
    });
  });
});
