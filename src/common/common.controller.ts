import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';

@Controller('common')
@ApiBearerAuth()
@ApiTags('common')
export class CommonController {
  constructor(
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) {}
  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 200000000,
      },
      fileFilter(req, file, callback) {
        if (file.mimetype !== 'video/mp4') {
          return callback(
            new BadRequestException('mp4 타입만 업로드 가능합니다'),
            false,
          );
        }
        // (에러, 파일을 받을지 안받을지 결정)
        return callback(null, true);
      },
    }),
  )
  async createVideo(@UploadedFile() video: Express.Multer.File) {
    await this.thumbnailQueue.add(
      'thumbnail',
      {
        videoId: video.filename,
        videoPath: video.path,
      },
      {
        priority: 1,
        delay: 100,
        attempts: 3, // n번까지 시도하고 그래도 진행되지않으면 skip
        lifo: true, // last in first out 스택구조로 변경
        removeOnComplete: false,
        removeOnFail: false, // queue 의 작업이 완료되고 나서도 원래는 보관하는데 이걸 삭제가능
      },
    );

    return {
      fileName: video.filename,
    };
  }
}
