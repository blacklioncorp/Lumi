export const MODULES_BY_PLAN = {
  basic: [
    "crm", "website", "whatsapp", 
    "google_calendar", "analytics"
  ],
  intermediate: [
    "crm", "website", "whatsapp", "google_calendar", 
    "analytics", "social_media", "google_sso"
  ],
  premium: [
    "crm", "website", "whatsapp", "google_calendar",
    "analytics", "social_media", "google_sso",
    "payments", "parent_portal", "pwa", 
    "nfc_access", "safelunch"
  ]
} as const;

export const MODULE_MINIMUM_PLAN = {
  crm: "basic",
  website: "basic", 
  whatsapp: "basic",
  google_calendar: "basic",
  analytics: "basic",
  social_media: "intermediate",
  google_sso: "intermediate",
  payments: "premium",
  parent_portal: "premium",
  pwa: "premium",
  nfc_access: "premium",
  safelunch: "premium"
} as const;

export type PlanType = 'basic' | 'intermediate' | 'premium';
export type ModuleType = keyof typeof MODULE_MINIMUM_PLAN;
