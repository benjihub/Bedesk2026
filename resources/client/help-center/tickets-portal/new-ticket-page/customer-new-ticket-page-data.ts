import {CompactAttribute} from '@app/attributes/compact-attribute';

export interface CustomerNewTicketPageData {
  attributes: CompactAttribute[];
  envatoItems?: {
    id: number;
    name: string;
    image: string;
    support_expired: boolean;
  }[];
  config: {
    title: string;
    submitButtonText: string;
    sidebarTitle: string;
    sidebarTips: {title: string; content: string}[];
    attributeIds?: number[];
  };
  customerEmail?: string;
  customerHasVerifiedEmail?: boolean;
}
