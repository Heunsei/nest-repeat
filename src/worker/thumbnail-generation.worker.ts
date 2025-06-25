import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { join } from 'path';
import * as ffmpegFluent from 'fluent-ffmpeg';
import { cwd } from 'process';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job, token?: string) {
    const { videoPath, videoId } = job.data;

    console.log(`Transcoding video with ID : ${videoId}`);

    const outputDirectory = join(cwd(), 'public', 'thumbnail');
    const outputThumbnailPath = join(outputDirectory, `${videoId}.png`);

    ffmpegFluent(videoPath)
      .screenshots({
        count: 1,
        filename: `${videoId}.png`,
        folder: outputDirectory,
        size: '320x240',
      })
      .on('end', () => {
        console.log(`thumbnail 생성 완료`);
      })
      .on('error', (error) => {
        console.log(error);
        console.log(`thumbnail 생성 실패`);
      });

    return 1;
  }
}
