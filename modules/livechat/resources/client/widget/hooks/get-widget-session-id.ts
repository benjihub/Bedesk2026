import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';

export function getWidgetSessionId(): string {
  return (getBootstrapData() as any).sessionId;
}
