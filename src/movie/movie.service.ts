import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly prisma: PrismaService,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikesMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .where('movie.id IN(:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() };
    });

    const movies = await this.prisma.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      take: take + 1,
      skip: cursor ? 1 : 0,
      orderBy,
      include: {
        genres: true,
        director: true,
      },
    });

    const hasNextPage = movies.length > take;

    if (hasNextPage) {
      movies.pop();
    }

    const nextCursor = hasNextPage
      ? movies[movies.length - 1].id.toString()
      : null;

    // const qb = await this.getMovies();

    // if (title) {
    //   qb.where('movie.title LIKE :title', { title: `%${title}%` });
    // }

    // const { nextCursor } =
    //   await this.commonService.applyCursorPaginationParamsToQb(qb, dto);

    // let [data, count] = await qb.getManyAndCount();

    if (userId) {
      const movieIds = movies.map((movie) => movie.id);
      // const movieIds = data.map((movie) => movie.id);

      const likedMovies =
        movieIds.length < 1
          ? []
          : await this.prisma.movieUserLike.findMany({
              where: {
                movieId: { in: movieIds },
                userId: userId,
              },
              include: {
                movie: true,
              },
            });
      // const likedMovies =
      //   movieIds.length < 1 ? [] : await this.getLikesMovies(movieIds, userId);

      const likedMovieMap = likedMovies.reduce(
        (acc, next) => ({
          ...acc,
          [next.movie.id]: next.isLike,
        }),
        {},
      );

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeStatus:
            movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hasNextPage,
      };

      // data = data.map((x) => ({
      //   ...x,
      //   likeStatus: x.id in likedMovieMap ? likedMovieMap[x.id] : null,
      // }));
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage,
    };
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return await this.movieRepository
    //   .createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
    });

    // const movie = await this.findMovieDetail(id);

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

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
    // key value 순으로 데이터 저장
    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC',
    //   },
    //   take: 10,
    // });

    await this.cacheManager.set('MOVIE_RECENT', data, 3000);
    return data;
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto) {
    // return await qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({
    //     detail: createMovieDto.detail,
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  async createMovie(
    qr: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: { id: movieDetailId },
    //     director,
    //     creator: {
    //       id: userId,
    //     },
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(
    qr: QueryRunner,
    movieId: number,
    genres: Genre[],
  ) {
    // return await qr.manager
    //   .createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movieId) // movieid에 해당하는 값을 조작
    //   .add(genres.map((genre) => genre.id)); // 관계를 추가할거다 movieId에 해당하도록
  }

  /* istanbul ignore next */
  async renameMovieFile(
    tempFolder: string,
    movieFolder: string,
    createMovieDto: CreateMovieDto,
  ) {
    return await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),
    );
  }

  async create(createMovieDto: CreateMovieDto, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const director = await prisma.director.findUnique({
        where: { id: createMovieDto.directorId },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 id의 감독입니다');
      }

      const genres = await prisma.genre.findMany({
        where: { id: { in: createMovieDto.genreIds } },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(
          `해당 장르는 존재하지 않습니다, 존재하지 않는 id => ${genres.map((genre) => genre.id).join(',')}`,
        );
      }

      const movieDetail = await prisma.movieDetail.create({
        data: { detail: createMovieDto.detail },
      });

      const movie = await prisma.movie.create({
        data: {
          title: createMovieDto.title,
          movieFilePath: createMovieDto.movieFileName,
          creator: { connect: { id: userId } },
          director: { connect: { id: director.id } },
          genres: { connect: genres.map((genre) => ({ id: genre.id })) },
          detail: { connect: { id: movieDetail.id } },
        },
      });
      return prisma.movie.findUnique({
        where: {
          id: movie.id,
        },
        include: {
          detail: true,
          director: true,
          genres: true,
        },
      });
    });
  }

  // async create(
  //   createMovieDto: CreateMovieDto,
  //   userId: number,
  //   qr: QueryRunner,
  // ) {
  // const director = await qr.manager.findOne(Director, {
  //   where: { id: createMovieDto.directorId },
  // });

  // if (!director) {
  //   throw new NotFoundException('존재하지 않는 id의 감독입니다');
  // }

  // const genres = await qr.manager.find(Genre, {
  //   where: { id: In(createMovieDto.genreIds) },
  // });

  // if (genres.length !== createMovieDto.genreIds.length) {
  //   throw new NotFoundException(
  //     `해당 장르는 존재하지 않습니다, 존재하지 않는 id => ${genres.map((genre) => genre.id).join(',')}`,
  //   );
  // }

  // const movieDetail = await this.createMovieDetail(qr, createMovieDto);

  // const movieDetailId = movieDetail.identifiers[0].id;

  // const movieFolder = join('public', 'movie');
  // const tempFolder = join('public', 'temp');

  // const movie = await this.createMovie(
  //   qr,
  //   createMovieDto,
  //   director,
  //   movieDetailId,
  //   userId,
  //   movieFolder,
  // );

  // const movieId = movie.identifiers[0].id;

  // n:m 관계 넣어주는 과정
  //   await this.createMovieGenreRelation(qr, movieId, genres);

  //   await this.renameMovieFile(tempFolder, movieFolder, createMovieDto);

  //   return await qr.manager.findOne(Movie, {
  //     where: { id: movieId },
  //     relations: ['detail', 'genres', 'director'],
  //   });
  // }

  /* istanbul ignore next */
  async updateMovie(
    qr: QueryRunner,
    movieUpdateFields: UpdateMovieDto,
    id: number,
  ) {
    // return await qr.manager
    //   .createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieDetail(qr: QueryRunner, detail: string, movie: Movie) {
    // return qr.manager
    //   .createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({ detail })
    //   .where('id = :id', { id: movie.detail.id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(
    qr: QueryRunner,
    id: number,
    newGenres: Genre[],
    movie: Movie,
  ) {
    return qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(id)
      .addAndRemove(
        newGenres.map((genre) => genre.id),
        movie.genres.map((genre) => genre.id),
      );
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    return this.prisma.$transaction(async (prisma) => {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          genres: true,
        },
      });

      if (!movie) throw new NotFoundException('해당 영화는 존재하지 않습니다');

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let movieUpdateParams: Prisma.MovieUpdateInput = {
        ...movieRest,
      };

      if (directorId) {
        const director = await prisma.director.findUnique({
          where: { id: directorId },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID의 감독입니다');
        }

        movieUpdateParams.director = { connect: { id: directorId } };
      }

      if (genreIds) {
        const genres = await prisma.genre.findMany({
          where: { id: { in: genreIds } },
        });
        if (genreIds.length !== genres.length) {
          throw new NotFoundException('존재하지 않는 장르가 있습니다');
        }

        movieUpdateParams.genres = {
          set: genres.map((genre) => ({ id: genre.id })),
        };
      }

      await prisma.movie.update({
        where: { id },
        data: movieUpdateParams,
      });

      if (detail) {
        await prisma.movieDetail.update({
          where: { id: movie.detail.id },
          data: { detail },
        });
      }

      return prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          director: true,
          genres: true,
        },
      });
    });
  }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();

  //   try {
  //     const movie = await qr.manager.findOne(Movie, {
  //       where: { id },
  //       relations: ['detail', 'genres'],
  //     });
  //     if (!movie) throw new NotFoundException('해당 영화는 존재하지 않습니다');
  //     // 받아온 dto를 구조분해
  //     const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

  //     let newDirector: undefined | Director;
  //     let newGenres: undefined | Genre[];

  //     if (directorId) {
  //       const director = await qr.manager.findOne(Director, {
  //         where: { id: directorId },
  //       });
  //       if (!director) {
  //         throw new NotFoundException('존재하지 않는 id의 감독입니다');
  //       }
  //       newDirector = director;
  //     }
  //     if (genreIds) {
  //       const genres = await qr.manager.find(Genre, {
  //         where: { id: In(genreIds) },
  //       });
  //       if (genres.length !== genreIds.length) {
  //         throw new NotFoundException('해당 장르는 존재하지 않는 장르입니다');
  //       }
  //       newGenres = genres;
  //     }
  //     // && 연산자는 앞의 값이 true 일 경우 뒤의 값을 반환, 그게 아니라면 자기자신 반환
  //     const movieUpdateFields = {
  //       ...movieRest,
  //       ...(newDirector && { director: newDirector }),
  //     };

  //     await this.updateMovie(qr, updateMovieDto, id);

  //     // await this.movieRepository.update({ id }, movieUpdateFields);

  //     if (detail) {
  //       await this.updateMovieDetail(qr, detail, movie);
  //       // await this.movieDetailRepository.update(
  //       //   {
  //       //     id: movie.detail.id,
  //       //   },
  //       //   {
  //       //     detail,
  //       //   },
  //       // );
  //     }

  //     if (newGenres) {
  //       await this.updateMovieGenreRelation(qr, id, newGenres, movie);
  //     }

  //     // const newMovie = await this.movieRepository.findOne({
  //     //   where: { id },
  //     //   relations: ['detail', 'director'],
  //     // });

  //     // newMovie!.genres = newGenres as Genre[];

  //     // await this.movieRepository.save(newMovie as Movie);
  //     await qr.commitTransaction();
  //     return this.movieRepository.findOne({
  //       where: { id },
  //       relations: ['detail', 'director', 'genres'],
  //     });
  //   } catch (e) {
  //     await qr.rollbackTransaction();
  //     throw e;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  /* istanbul ignore next */
  async deleteMovie(id: number) {
    // return await this.movieRepository
    //   .createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        detail: true,
      },
    });

    // const movie = await this.movieRepository.findOne({
    //   where: { id },
    //   relations: ['detail'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 입니다');
    }

    // await this.movieRepository.delete(movie);

    await this.prisma.movie.delete({ where: { id } });
    // await this.deleteMovie(id);
    await this.prisma.movieDetail.delete({
      where: { id: movie.detail.id },
    });
    // await this.movieDetailRepository.delete(movie.detail.id);
    return id;
  }

  /* istanbul ignore next */
  async getLikedRecord(movieId: number, userId: number) {
    // return await this.movieUserLikeRepository
    //   .createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id: movieId,
    //   },
    // });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId,
    //   },
    // });

    if (!user) {
      throw new BadRequestException('존재하지 않는 사용자입니다');
    }

    const likeRecord = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: { movieId, userId },
      },
    });
    // const likeRecord = await this.getLikedRecord(movieId, userId);

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.prisma.movieUserLike.delete({
          where: {
            movieId_userId: { movieId, userId },
          },
        });
        // await this.movieUserLikeRepository.delete({
        //   movie,
        //   user,
        // });
      } else {
        await this.prisma.movieUserLike.update({
          where: { movieId_userId: { movieId, userId } },
          data: { isLike },
        });

        // await this.movieUserLikeRepository.update(
        //   {
        //     movie,
        //     user,
        //   },
        //   { isLike },
        // );
      }
    } else {
      await this.prisma.movieUserLike.create({
        data: {
          // 관계를 만들땐 connect 사용
          movie: { connect: { id: movieId } },
          user: { connect: { id: userId } },
          isLike,
        },
      });
      // await this.movieUserLikeRepository.save({
      //   movie,
      //   user,
      //   isLike,
      // });
    }
    const result = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: { movieId, userId },
      },
    });

    // const result = await this.getLikedRecord(movieId, userId);

    return {
      isLike: result && result.isLike,
    };
  }
}
