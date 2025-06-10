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
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (user) {
      throw new BadRequestException('이미 존재하는 유저입니다');
    }

    const hash = await bcrypt.hash(
      createUserDto.password,
      this.configService.get<number>(envVariablesKeys.hashRounds) as number,
    );

    await this.userRepository.save({
      email: createUserDto.email,
      password: hash,
    });

    return this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당 id의 유저는 존재하지 않습니다');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당아이디의 유저는 존재하지 않습니다');
    }
    await this.userRepository.update({ id }, { ...updateUserDto });
    return await this.userRepository.findOne({ where: { id } });
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('해당아이디의 유저는 존재하지 않습니다');
    }
    await this.userRepository.delete(id);
    return id;
  }
}
