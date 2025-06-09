import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { DefaultLogger } from './logger/default.logger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private readonly schedulerRegistry: SchedulerRegistry,
    // private readonly logger: DefaultLogger,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  // @Cron('* * * * * *')
  logEverySecond() {
    this.logger.log('1초마다 실행', TasksService.name);
    this.logger.error('test', null, TasksService.name);
  }

  // @Cron('*/5 * * * * *')
  async eraseOrphanFiles() {
    // readdir -> 해당 디렉토리 안의 파일들을 전부 읽어올 수 있는 기능.
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name; // 확장자를 제거한 이름 반환
      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date >= aDayInMilSec;
      } catch {
        return true;
      }
    });

    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );
  }

  // @Cron('* * * * * *')
  async calculateMovieLikeCounts() {
    await this.movieRepository.query(
      `UPDATE movie m
      SET "likeCount" = (SELECT count(*) FROM movie_user_like mul
      WHERE m.id = mul."movieId" AND mul."isLike" = true)
      `,
    );

    await this.movieRepository.query(
      `UPDATE movie m
      SET "dislikeCount" = (SELECT count(*) FROM movie_user_like mul
      WHERE m.id = mul."movieId" AND mul."isLike" = false)
      `,
    );
  }

  // @Cron('* * * * * *', {
  //   name: 'printer',
  // })
  printer() {
    console.log('print every second');
  }

  // @Cron('*/5 * * * * *')
  stopper() {
    const job = this.schedulerRegistry.getCronJob('printer');

    if (job.isActive) {
      job.stop();
    } else {
      job.start();
    }
  }
}
