import { Tenant } from './database';

export interface TenantContext {
  tenant: Tenant;
  isCustomDomain: boolean;
  hostname: string;
}
