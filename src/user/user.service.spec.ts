import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          // model의 이름 값으로 repository의 레퍼런스를 가져올 수 있음
          // 모듈을 생성할 때 직접 모듈을 넣는게 아니라 토큰 user를 통해 알려준 값을
          // mock으로 대체해라.
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@naver.com',
        password: 'test1234',
      };

      const hashRounds = 10;
      const hashedPassword = 'testest';
      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
      };

      // 사용자가 없어야 정상적으로 생성이 되니까.
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await userService.create(createUserDto);

      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { email: createUserDto.email },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { email: createUserDto.email },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword,
      });
    });
    it('should throw a BadRequestException if email already exists', () => {
      const createUserDto: CreateUserDto = {
        email: 'test1234@naver.com',
        password: '12341234',
      };
      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue({ id: 1, email: createUserDto.email });
      expect(userService.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
    });
  });

  // grouping
  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test1@naver.com',
        },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAll();

      expect(result).toEqual(users);

      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: 1, email: 'test1@naver.com' };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await userService.findOne(1);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      expect(userService.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('remove', () => {
    it('should be remove by user id', async () => {
      const userId = 1;
      jest
        .spyOn(mockUserRepository, 'findOne')
        .mockResolvedValue({ id: userId });

      const result = await userService.remove(userId);

      expect(result).toEqual(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
    it('should be throw NotFoundExecption', async () => {
      const userId = 999;
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('update', () => {
    it('should update user if it exists', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test1234@naver.com',
        password: '1234123',
      };
      const hashRounds = 10;
      const hashedPassword = 'testtest';
      const user = {
        id: 1,
        email: updateUserDto.email,
        password: updateUserDto.password,
      };
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRounds);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation((password, hashRounds) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword,
      });

      const result = await userService.update(1, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashedPassword,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        updateUserDto.password,
        hashRounds,
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        {
          id: 1,
        },
        {
          ...updateUserDto,
          password: hashedPassword,
        },
      );
    });
    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const updateUserDto: UpdateUserDto = {
        email: 'test@naver.com',
        password: '1234',
      };

      expect(userService.update(99, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 99 },
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});
