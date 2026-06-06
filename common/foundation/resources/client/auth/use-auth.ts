import {Permission} from '@common/auth/permission';
import {BootstrapData} from '@ui/bootstrap-data/bootstrap-data';
import {
  getBootstrapData,
  useBootstrapDataStore,
} from '@ui/bootstrap-data/bootstrap-data-store';
import {User} from '@ui/types/user';
import {getFromLocalStorage} from '@ui/utils/hooks/local-storage';
import {useMemo} from 'react';

type OnboardingState = {
  productId: number;
  priceId: number;
} | null;

interface UseAuthReturn {
  user: User | null;
  hasPermission: (permission: string) => boolean;
  getPermission: (permission: string) => Permission | undefined;
  getRestrictionValue: (
    permission: string,
    restriction: string,
  ) => string | number | boolean | undefined | null;
  checkOverQuotaOrNoPermission: (
    permission: string,
    restrictionName: string,
    currentCount: number,
  ) => {
    overQuota: boolean;
    noPermission: boolean;
    overQuotaOrNoPermission: boolean;
  };
  hasRole: (roleId: number) => boolean;
  isLoggedIn: boolean;
  isSubscribed: boolean;
  getRedirectUri: () => string;
}

export function useAuth(): UseAuthReturn {
  const data = useBootstrapDataStore(s => s.data);
  return useMemo(() => {
    const auth = new _Auth(data);
    return {
      user: auth.user,
      hasPermission: auth.hasPermission.bind(auth),
      getPermission: auth.getPermission.bind(auth),
      getRestrictionValue: auth.getRestrictionValue.bind(auth),
      checkOverQuotaOrNoPermission:
        auth.checkOverQuotaOrNoPermission.bind(auth),
      hasRole: auth.hasRole.bind(auth),
      isLoggedIn: auth.isLoggedIn,
      isSubscribed: auth.isSubscribed,
      getRedirectUri: auth.getRedirectUri.bind(auth),
    };
  }, [data]);
}

class _Auth {
  get data() {
    return this._data ?? getBootstrapData();
  }

  constructor(private _data?: BootstrapData) {}

  get user() {
    return this.data.user;
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get isSubscribed(): boolean {
    return this.user?.subscriptions?.find(sub => sub.valid) != null;
  }

  get guestRole() {
    return this.data.guest_role;
  }

  getPermission(name: string): Permission | undefined {
    const permissions = this.user?.permissions || this.guestRole?.permissions;
    if (!permissions) return;
    return permissions.find(p => p.name === name);
  }

  hasPermission(name: string): boolean {
    const permissions = this.user?.permissions || this.guestRole?.permissions;
    const isAdmin = permissions?.find(p => p.name === 'admin') != null;
    return isAdmin || this.getPermission(name) != null;
  }

  hasRole(roleId: number): boolean {
    return this.user?.roles?.find(role => role.id === roleId) != null;
  }

  checkOverQuotaOrNoPermission(
    permission: string,
    restrictionName: string,
    currentCount: number,
  ) {
    const noPermission = !this.hasPermission(permission);
    const maxCount = this.getRestrictionValue(permission, restrictionName) as
      | number
      | null;
    const overQuota = maxCount != null && currentCount >= maxCount;
    return {
      overQuota: maxCount != null && currentCount >= maxCount,
      noPermission,
      overQuotaOrNoPermission: overQuota || noPermission,
    };
  }

  getRestrictionValue(
    permissionName: string,
    restrictionName: string,
  ): string | number | boolean | undefined | null {
    const permission = this.getPermission(permissionName);
    let restrictionValue = null;
    if (permission) {
      const restriction = permission.restrictions.find(
        r => r.name === restrictionName,
      );
      restrictionValue = restriction ? restriction.value : undefined;
    }
    return restrictionValue;
  }

  // where to redirect user after successful login
  getRedirectUri(): string {
    const onboarding = getFromLocalStorage<OnboardingState>(
      'be.onboarding.selected',
    );
    if (onboarding) {
      return `/checkout/${onboarding.productId}/${onboarding.priceId}`;
    }
    return getBootstrapData().auth_redirect_uri ?? '/';
  }
}

export const auth = new _Auth();
