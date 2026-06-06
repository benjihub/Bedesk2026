import {AccessToken} from '@common/auth/access-token';
import {Permission} from '@common/auth/permission';
import {SocialProfile} from '@common/auth/social-profile';
import {Subscription} from '@common/billing/subscription';
import {User, USER_MODEL} from '@ui/types/user';

export interface BaseBackendUser {
  name?: string;
  image?: string | null;
  email_verified_at: string;
  permissions?: Permission[];
  password: string;
  created_at: string;
  updated_at: string;
  subscriptions?: Omit<Subscription, 'user'>[];
  roles?: {id: number; name: string}[];
  social_profiles: SocialProfile[];
  tokens?: AccessToken[];
  has_password: boolean;
  unread_notifications_count?: number;
  card_last_four?: number;
  card_brand?: string;
  card_expires?: string;
  model_type: typeof USER_MODEL;
  banned_at?: string;
  followed_users?: Omit<User, 'followed_users' | 'followers'>[];
  followers_count?: number;
  followed_users_count?: number;
  followers?: Omit<User, 'followed_users' | 'followers'>[];
  latest_active_session?: {
    id: number;
    updated_at: string;
  };
  bans?: {
    id: number;
    comment: string;
    expired_at?: string;
  }[];
  two_factor_confirmed_at?: string;
  two_factor_recovery_codes?: string[];
}
