import {User} from '@ui/types/user';

export interface UpdateUserPageUser {
  id: User['id'];
  name: User['name'];
  email: User['email'];
  image: User['image'];
  image_entry_id?: number | null;
  banned_at: User['banned_at'];
  bans: User['bans'];
  roles: User['roles'];
  tokens: User['tokens'];
  language: User['language'];
  country: User['country'];
  timezone: User['timezone'];
  social_profiles: User['social_profiles'];
  two_factor_confirmed_at: User['two_factor_confirmed_at'];
  two_factor_recovery_codes: User['two_factor_recovery_codes'];
  email_verified_at: User['email_verified_at'];
  permissions: User['permissions'];
}
