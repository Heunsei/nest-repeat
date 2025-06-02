import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
} from '@nestjs/common';

@Catch(ForbiddenException)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const status = exception.getStatus();

    console.log(`[UnauthorizedException] ${request.method} ${response.path}`);
    response.status(status).json({
      statusCode: status,
      timeStamp: new Date().toISOString(),
      path: request.url,
      message: '권한이 없습니다',
    });
  }
}
