import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) {}

  async findAll(dto: GetMoviesDto) {
    const { title, take, page } = dto;
    const qb = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');
    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }
    if (take && page) {
      this.commonService.applyPagePaginationParamsToQb(qb, dto);
    }
    return await qb.getManyAndCount();
    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['director'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }
    // return await this.movieRepository.findAndCount({
    //   where: { title: Like(`%${title}%`) },
    //   relations: ['director'],
    // });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 Id의 영화입니다');
    }
    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      const director = await qr.manager.findOne(Director, {
        where: { id: createMovieDto.directorId },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 id의 감독입니다');
      }

      const genres = await qr.manager.find(Genre, {
        where: { id: In(createMovieDto.genreIds) },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `해당 장르는 존재하지 않습니다, 존재하지 않는 id => ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(MovieDetail)
        .values({
          detail: createMovieDto.detail,
        })
        .execute();

      const movieDetailId = movieDetail.identifiers[0].id;

      const movie = await qr.manager
        .createQueryBuilder()
        .insert()
        .into(Movie)
        .values({
          title: createMovieDto.title,
          detail: { id: movieDetailId },
          director,
        })
        .execute();

      const movieId = movie.identifiers[0].id;
      // n:m 관계 넣어주는 과정
      await qr.manager
        .createQueryBuilder()
        .relation(Movie, 'genres')
        .of(movieId) // movieid에 해당하는 값을 조작
        .add(genres.map((genre) => genre.id)); // 관계를 추가할거다 movieId에 해당하도록

      // 쿼리빌더에서는 한번에 만드는게 불편해서 저장은 repo 패턴쓰는게 편함
      // cascade 불가. onetoone, many t oone은 가능
      // const movie = await this.movieRepository.save({
      //   title: createMovieDto.title,
      //   detail: { detail: createMovieDto.detail },
      //   genres,
      //   director,
      // });
      // return movie;

      await qr.commitTransaction();
      return await this.movieRepository.find({
        where: { id: movieId },
        relations: ['detail', 'genres', 'director'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: { id },
        relations: ['detail', 'genres'],
      });
      if (!movie) throw new NotFoundException('해당 영화는 존재하지 않습니다');
      // 받아온 dto를 구조분해
      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector: undefined | Director;
      let newGenres: undefined | Genre[];

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: { id: directorId },
        });
        if (!director) {
          throw new NotFoundException('존재하지 않는 id의 감독입니다');
        }
        newDirector = director;
      }
      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: { id: In(genreIds) },
        });
        if (genres.length !== genreIds.length) {
          throw new NotFoundException('해당 장르는 존재하지 않는 장르입니다');
        }
        newGenres = genres;
      }
      // && 연산자는 앞의 값이 true 일 경우 뒤의 값을 반환, 그게 아니라면 자기자신 반환
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      // await this.movieRepository.update({ id }, movieUpdateFields);

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
        // await this.movieDetailRepository.update(
        //   {
        //     id: movie.detail.id,
        //   },
        //   {
        //     detail,
        //   },
        // );
      }

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id),
          );
      }

      // const newMovie = await this.movieRepository.findOne({
      //   where: { id },
      //   relations: ['detail', 'director'],
      // });

      // newMovie!.genres = newGenres as Genre[];

      // await this.movieRepository.save(newMovie as Movie);
      await qr.commitTransaction();
      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['detail'],
    });
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 입니다');
    }
    // await this.movieRepository.delete(movie);
    await this.movieRepository
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
    await this.movieDetailRepository.delete(movie.detail.id);
    return id;
  }
}
