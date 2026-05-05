import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

const excludedKey = 'password';

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        if (Array.isArray(data)) {
          return data.map((item) => {
            return Object.fromEntries(
              Object.entries(item).filter(([key]) => key !== excludedKey),
            );
          });
        }

        return Object.fromEntries(
          Object.entries(data).filter(([key]) => key !== excludedKey),
        );
      }),
    );
  }
}
