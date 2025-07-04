import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { envVariablesKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.prisma.user.findUnique({ where: { email } });

    // const user = await this.userRepository.findOne({
    //   where: { email },
    // });

    if (user) {
      throw new BadRequestException('이미 존재하는 유저입니다');
    }

    const hash = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariablesKeys.hashRounds) as number,
    );

    await this.prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });

    // await this.userRepository.save({
    //   email,
    //   password: hash,
    // });

    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    // return this.userRepository.findOne({
    //   where: { email },
    // });
  }

  async findAll() {
    return await this.prisma.user.findMany({
      omit: { password: true },
    });
    // return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    // const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당 id의 유저는 존재하지 않습니다');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;

    const user = await this.prisma.user.findUnique({ where: { id } });

    // const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('해당아이디의 유저는 존재하지 않습니다');
    }

    let input: Prisma.UserUpdateInput = {
      ...updateUserDto,
    };

    if (password) {
      const hash = await bcrypt.hash(
        password as string,
        this.configService.get<number>(envVariablesKeys.hashRounds) as number,
      );
      input = {
        ...input,
        password: hash,
      };
    }

    await this.prisma.user.update({
      where: {
        id,
      },
      data: input,
    });

    // await this.userRepository.update(
    //   { id },
    //   { ...updateUserDto, password: hash },
    // );

    return await this.prisma.user.findUnique({ where: { id } });
    // return await this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    // const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당아이디의 유저는 존재하지 않습니다');
    }

    await this.prisma.user.delete({
      where: { id },
    });
    // await this.userRepository.delete(id);
    return id;
  }
}
