import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class DefaultLogger extends ConsoleLogger {
  warn(message: unknown, ...rest: unknown[]): void {
    super.warn(message, ...rest);
  }

  error(message: unknown, ...rest: unknown[]): void {
    super.error(message, ...rest);
  }
}
