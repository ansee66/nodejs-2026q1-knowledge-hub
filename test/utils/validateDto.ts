import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export const validateDto = async <T extends object>(
  DtoClass: new () => T,
  plain: Record<string, unknown>,
) => {
  const instance = plainToInstance(DtoClass, plain);
  return validate(instance);
};
