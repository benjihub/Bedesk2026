export const USER_MODEL = 'user';

export interface User {
  id: number;
  name: string;
  email: string;
  language?: string;
  timezone?: string;
  country?: string;
}
