import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  ping() {
    return { ok: true, module: 'ai' };
  }
}
