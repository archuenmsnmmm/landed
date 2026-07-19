export const SALES_ROLE_OPTIONS = [
  "SDR/BDR",
  "Account Executive",
  "Full-cycle Account Executive",
  "Marketing",
  "Sales Leader",
  "Founder/CEO",
  "Operations",
  "IT Support",
  "Customer Success",
  "Other",
] as const;

export type SalesRole = (typeof SALES_ROLE_OPTIONS)[number];
