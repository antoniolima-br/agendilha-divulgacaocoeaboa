export interface PitchContent {
  differential: string;
  regionalExample: string;
  formats: { title: string; cycle: string; min: number; max: number; description: string }[];
  capacity: string;
  placementTicket: number;
  eventTicket: number;
  scenarios: { month: number; regions: number; placements: number; events: number; marketing: number; placementRevenue: number; eventRevenue: number; revenue: number; afterMarketing: number }[];
  disclaimer: string;
  marketingMin: number;
  marketingMax: number;
  acquisition: { title: string; description: string }[];
}
