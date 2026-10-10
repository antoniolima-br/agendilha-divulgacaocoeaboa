export interface PitchContent {
  inventoryImage?: string;
  brandPositioning: string;
  monetization: string;
  projectionBasis: string;
  projectionRegional?: string;
  projectionGlobal?: string;
  advertisingExclusivity?: { title: string; description: string; items: { title: string; description: string }[]; disclaimer: string };
  differential: string;
  regionalExample: string;
  formats: { title: string; cycle: string; min: number; max: number; description: string; priceSuffix?: string }[];
  capacity: string;
  placementTicket: number;
  eventTicket: number;
  pushTicket: number;
  push: { title: string; example: string; value: string; requirements: string; packageSends: number; packagePrice: number };
  anchor: { title: string; description: string; tiers: { title: string; slots: number; min: number; max: number; description: string }[]; billing: string; monthlyMin: number; monthlyMax: number; banner: string; countdown: string; phases: { title: string; description: string }[]; disclaimer: string };
  scenarios: { month: number; phase: string; regions: number; placements: number; events: number; pushes: number; marketing: number; placementRevenue: number; eventRevenue: number; pushRevenue: number; revenue: number; afterMarketing: number }[];
  disclaimer: string;
  marketingMin: number;
  marketingMax: number;
  selfService: { title: string; description: string; strategy: string; steps: { title: string; description: string }[]; disclaimer: string };
  acquisition: { title: string; description: string }[];
}
