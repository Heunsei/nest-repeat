import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Director } from './entity/director.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class DirectorService {
  constructor(
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    private readonly prisma: PrismaService,
  ) {}

  async create(createDirectorDto: CreateDirectorDto) {
    return this.prisma.director.create({ data: createDirectorDto });
    // return this.directorRepository.save(createDirectorDto);
  }

  async findAll() {
    return this.prisma.director.findMany();
    // return this.directorRepository.find();
  }

  async findOne(id: number) {
    const director = await this.prisma.director.findUnique({
      where: { id },
    });
    // const director = await this.directorRepository.findOne({
    //   where: { id },
    // });
    if (!director) {
      throw new NotFoundException('해당 감독은 존재하지 않습니다');
    }
    return director;
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.prisma.director.findUnique({
      where: { id },
    });
    // const director = await this.directorRepository.find({
    //   where: { id },
    // });
    if (!director) {
      throw new NotFoundException('해당 id의 감독은 존재하지 않습니다');
    }

    await this.prisma.director.update({
      where: { id },
      data: { ...updateDirectorDto },
    });

    // await this.directorRepository.update(
    //   {
    //     id,
    //   },
    //   { ...updateDirectorDto },
    // );

    const updatedDirector = await this.prisma.director.findUnique({
      where: { id },
    });

    // const updatedDirector = await this.directorRepository.find({
    //   where: { id },
    // });
    return updatedDirector;
  }

  async remove(id: number) {
    const deleteUser = await this.prisma.director.findUnique({
      where: { id },
    });

    // const deleteUser = await this.directorRepository.findOne({ where: { id } });

    if (!deleteUser) {
      throw new NotFoundException('해당 유저는 존재하지 않습니다.');
    }

    await this.prisma.director.delete({ where: { id } });
    // await this.directorRepository.delete(id);
    return id;
  }
}
