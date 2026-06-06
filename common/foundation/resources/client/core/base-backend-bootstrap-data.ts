import {UploadType} from '@app/site-config';
import {Role} from '@common/auth/role';
import {MetaTag} from '@common/seo/meta-tag';

export type PartialUploadType = {
  visibility: string;
  max_file_size?: number | string;
  accept?: string[];
  backends: {id: string; driver: string; direct_upload?: boolean}[];
};

export interface BaseBackendBootstrapData {
  csrf_token: string;
  auth_redirect_uri: string;
  guest_role: Role | null;
  default_meta_tags: MetaTag[];
  show_cookie_notice?: boolean;
  uploading_types: Record<keyof typeof UploadType, PartialUploadType>;
}
