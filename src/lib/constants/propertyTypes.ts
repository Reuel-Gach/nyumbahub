export type PropertyCategory = "Residential" | "Commercial" | "Land";

export interface PropertySubType {
  id: string;
  name: string;
  parent_category: PropertyCategory;
  description: string;
}

export const PROPERTY_TYPES: PropertySubType[] = [
  // RESIDENTIAL
  {
    id: "res_bedsitter",
    name: "Bedsitter",
    parent_category: "Residential",
    description: "A single-room unit combining the bedroom, living space, and kitchenette, with a separate enclosed bathroom."
  },
  {
    id: "res_studio",
    name: "Studio",
    parent_category: "Residential",
    description: "A modern, open-plan living space combining the living area, sleeping area, and kitchen, typically larger and more premium than a bedsitter."
  },
  {
    id: "res_apartment",
    name: "Apartment",
    parent_category: "Residential",
    description: "A self-contained housing unit occupying part of a multi-story building, available in various bedroom configurations."
  },
  {
    id: "res_maisonette",
    name: "Maisonette",
    parent_category: "Residential",
    description: "A multi-level residential unit, often featuring its own private entrance and small garden, typically located within a larger estate."
  },
  {
    id: "res_bungalow",
    name: "Bungalow",
    parent_category: "Residential",
    description: "A single-story, freestanding house, often set within its own private compound."
  },
  {
    id: "res_townhouse",
    name: "Townhouse",
    parent_category: "Residential",
    description: "A multi-level, terraced home sharing side walls with adjacent properties, usually located within a secure, gated community."
  },
  {
    id: "res_villa",
    name: "Villa",
    parent_category: "Residential",
    description: "A large, luxurious, standalone residence featuring extensive grounds, premium finishes, and exclusive amenities."
  },

  // COMMERCIAL
  {
    id: "com_office",
    name: "Office Space",
    parent_category: "Commercial",
    description: "Dedicated commercial premises designed for professional, administrative, or corporate activities."
  },
  {
    id: "com_retail",
    name: "Retail Shop",
    parent_category: "Commercial",
    description: "A storefront or commercial space intended for selling goods or services directly to consumers."
  },
  {
    id: "com_warehouse",
    name: "Warehouse",
    parent_category: "Commercial",
    description: "A large, open facility designed for the storage, distribution, or light manufacturing of goods."
  },
  {
    id: "com_showroom",
    name: "Showroom",
    parent_category: "Commercial",
    description: "A spacious, highly visible commercial area designed primarily for displaying products to potential buyers."
  },
  {
    id: "com_restaurant",
    name: "Restaurant/Cafe",
    parent_category: "Commercial",
    description: "A commercial space equipped with appropriate zoning and layout for food preparation and dining service."
  },

  // LAND
  {
    id: "lnd_agricultural",
    name: "Agricultural Land",
    parent_category: "Land",
    description: "Tracts of land designated and suitable for farming, cultivation, or livestock rearing."
  },
  {
    id: "lnd_commercial",
    name: "Commercial Land",
    parent_category: "Land",
    description: "Plots zoned specifically for the development of commercial properties, such as offices, retail centers, or hospitality venues."
  },
  {
    id: "lnd_residential",
    name: "Residential Land",
    parent_category: "Land",
    description: "Parcels of land zoned for the construction of single-family homes, apartment blocks, or housing estates."
  },
  {
    id: "lnd_industrial",
    name: "Industrial Land",
    parent_category: "Land",
    description: "Land designated for factories, heavy manufacturing, logistics hubs, or large-scale warehousing."
  }
];

// Helper functions for the UI
export const getCategories = (): PropertyCategory[] => ["Residential", "Commercial", "Land"];

export const getSubTypesByCategory = (category: PropertyCategory) => {
  return PROPERTY_TYPES.filter(type => type.parent_category === category);
};