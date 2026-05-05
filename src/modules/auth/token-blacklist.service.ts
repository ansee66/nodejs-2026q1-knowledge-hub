import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly tokens = new Set<string>();

  add(token: string): void {
    this.tokens.add(token);
  }

  has(token: string): boolean {
    return this.tokens.has(token);
  }
}
