import { SetMetadata } from '@nestjs/common';

export const ALLOW_AUTH_KEY = 'allow_authenticated';

export const AllowAuthenticated = () => SetMetadata(ALLOW_AUTH_KEY, true);
