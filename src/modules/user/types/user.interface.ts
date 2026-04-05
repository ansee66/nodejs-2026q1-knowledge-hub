import { UserRole } from 'src/common/enums';

export interface User {
  id: string;
  login: string;
  password: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}
