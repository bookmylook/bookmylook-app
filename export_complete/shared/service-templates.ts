/**
 * Ready-made service templates for providers
 * Based on actual salon menus (Pari's Beauty Saloon & Hameedhiya Mens Salon)
 */

export interface ServiceTemplate {
  id: string;
  name: string;
  category: string;
  isPopular: boolean; // Popular services shown by default
  defaultPrice?: number; // Suggested price
  defaultDuration?: number; // Suggested duration in minutes
}

export interface ServiceCategory {
  name: string;
  services: ServiceTemplate[];
}

/**
 * LADIES SERVICES - Based on Pari's Beauty Saloon menu
 */
export const LADIES_SERVICE_TEMPLATES: ServiceCategory[] = [
  {
    name: "Threading",
    services: [
      { id: "threading-eyebrows", name: "Eyebrows", category: "Threading", isPopular: true },
      { id: "threading-upper-lips", name: "Upper Lips", category: "Threading", isPopular: true },
      { id: "threading-lower-lips", name: "Lower Lips", category: "Threading", isPopular: false },
      { id: "threading-forehead", name: "Forehead", category: "Threading", isPopular: false },
      { id: "threading-chin", name: "Chin", category: "Threading", isPopular: false },
      { id: "threading-full-face", name: "Full Face", category: "Threading", isPopular: true },
    ]
  },
  {
    name: "Waxing",
    services: [
      { id: "waxing-half-arms", name: "Half Arms Wax", category: "Waxing", isPopular: false },
      { id: "waxing-full-arms", name: "Full Arms Wax", category: "Waxing", isPopular: true },
      { id: "waxing-half-legs", name: "Half Legs Wax", category: "Waxing", isPopular: false },
      { id: "waxing-full-legs", name: "Full Legs Wax", category: "Waxing", isPopular: true },
      { id: "waxing-full-body", name: "Full Body Wax", category: "Waxing", isPopular: false },
    ]
  },
  {
    name: "Facial",
    services: [
      { id: "facial-normal", name: "Normal Facial", category: "Facial", isPopular: true },
      { id: "facial-herbal", name: "Herbal Facial", category: "Facial", isPopular: false },
      { id: "facial-whitening", name: "Whitening Facial", category: "Facial", isPopular: true },
      { id: "facial-derma-whitening", name: "Derma Whitening Facial", category: "Facial", isPopular: false },
      { id: "facial-fruity", name: "Fruity Facial", category: "Facial", isPopular: false },
      { id: "facial-jameson", name: "Jameson Facial", category: "Facial", isPopular: false },
      { id: "facial-flore-dello", name: "Flore Dello Whitening Facial", category: "Facial", isPopular: false },
      { id: "facial-jameson-whitening", name: "Jameson Whitening Facial", category: "Facial", isPopular: false },
      { id: "facial-acne", name: "Acne Facial", category: "Facial", isPopular: false },
      { id: "facial-lifting", name: "Lifting Facial", category: "Facial", isPopular: false },
    ]
  },
  {
    name: "Hair Cutting",
    services: [
      { id: "haircut-baby", name: "Baby Cut", category: "Hair Cutting", isPopular: false },
      { id: "haircut-mushroom", name: "Mushroom Cut", category: "Hair Cutting", isPopular: false },
      { id: "haircut-bobi", name: "Bobi Cut", category: "Hair Cutting", isPopular: false },
      { id: "haircut-v-cut", name: "V-Cut", category: "Hair Cutting", isPopular: true },
      { id: "haircut-u-cut", name: "U-Cut", category: "Hair Cutting", isPopular: true },
      { id: "haircut-deep-u", name: "Deep U", category: "Hair Cutting", isPopular: false },
      { id: "haircut-layer", name: "Layer Cut", category: "Hair Cutting", isPopular: true },
      { id: "haircut-step-v", name: "Step V Cut", category: "Hair Cutting", isPopular: false },
      { id: "haircut-volume", name: "Volume Cut", category: "Hair Cutting", isPopular: false },
    ]
  },
  {
    name: "Bleach",
    services: [
      { id: "bleach-normal", name: "Normal Bleach", category: "Bleach", isPopular: true },
      { id: "bleach-herbal", name: "Herbal Bleach", category: "Bleach", isPopular: false },
      { id: "bleach-whitening", name: "Whitening Bleach", category: "Bleach", isPopular: false },
      { id: "bleach-skin", name: "Skin Bleach", category: "Bleach", isPopular: false },
      { id: "bleach-half-arms", name: "Half Arms Bleach", category: "Bleach", isPopular: false },
      { id: "bleach-full-arms", name: "Full Arms Bleach", category: "Bleach", isPopular: true },
      { id: "bleach-body-polishing", name: "Body Polishing", category: "Bleach", isPopular: false },
    ]
  },
  {
    name: "Cleansing",
    services: [
      { id: "cleansing-normal", name: "Normal Cleansing", category: "Cleansing", isPopular: false },
      { id: "cleansing-herbal", name: "Herbal Cleansing", category: "Cleansing", isPopular: false },
      { id: "cleansing-whitening", name: "Whitening Cleansing", category: "Cleansing", isPopular: false },
      { id: "cleansing-jameson", name: "Jameson Cleansing", category: "Cleansing", isPopular: false },
      { id: "cleansing-flore-dello", name: "Flore Dello", category: "Cleansing", isPopular: false },
      { id: "cleansing-fruit", name: "Fruit Cleansing", category: "Cleansing", isPopular: false },
      { id: "cleansing-oxyara", name: "Oxyara Whitening", category: "Cleansing", isPopular: false },
    ]
  },
  {
    name: "Hot Wax",
    services: [
      { id: "hotwax-eyebrows", name: "Eyebrows", category: "Hot Wax", isPopular: false },
      { id: "hotwax-upper-lips", name: "Upper Lips", category: "Hot Wax", isPopular: false },
      { id: "hotwax-side", name: "Side Wax", category: "Hot Wax", isPopular: false },
      { id: "hotwax-chin", name: "Chin", category: "Hot Wax", isPopular: false },
      { id: "hotwax-face-head", name: "Face Head", category: "Hot Wax", isPopular: false },
      { id: "hotwax-full-face", name: "Full Face Wax", category: "Hot Wax", isPopular: false },
    ]
  },
  {
    name: "Hair Treatment",
    services: [
      { id: "treatment-protein", name: "Protein Treatment", category: "Hair Treatment", isPopular: false },
      { id: "treatment-organic", name: "Organic Treatment", category: "Hair Treatment", isPopular: false },
      { id: "treatment-oil-massage", name: "Oil Massage", category: "Hair Treatment", isPopular: false },
      { id: "treatment-shampoo", name: "Shampoo Wash", category: "Hair Treatment", isPopular: false },
    ]
  },
  {
    name: "Hair Fashion",
    services: [
      { id: "fashion-rebonding", name: "Rebonding", category: "Hair Fashion", isPopular: false },
      { id: "fashion-x-tenso", name: "X-Tenso", category: "Hair Fashion", isPopular: false },
      { id: "fashion-outing", name: "Outing", category: "Hair Fashion", isPopular: false },
      { id: "fashion-keratin", name: "Keratin", category: "Hair Fashion", isPopular: false },
      { id: "fashion-streaking", name: "Streaking", category: "Hair Fashion", isPopular: false },
      { id: "fashion-ironing", name: "Ironing", category: "Hair Fashion", isPopular: false },
      { id: "fashion-chunks", name: "Chunks", category: "Hair Fashion", isPopular: false },
      { id: "fashion-highlight", name: "Highlight", category: "Hair Fashion", isPopular: false },
      { id: "fashion-root-touching", name: "Root Touching", category: "Hair Fashion", isPopular: false },
      { id: "fashion-color", name: "Fashion Color", category: "Hair Fashion", isPopular: false },
    ]
  },
];

/**
 * MEN'S SERVICES - Based on Hameedhiya Mens Salon menu
 */
export const MENS_SERVICE_TEMPLATES: ServiceCategory[] = [
  {
    name: "Hair Cut",
    services: [
      { id: "haircut-basic", name: "Basic Hair Cut", category: "Hair Cut", isPopular: true },
      { id: "haircut-stylish", name: "Stylish Hair Cut", category: "Hair Cut", isPopular: true },
      { id: "haircut-kids", name: "Kids Hair Cut", category: "Hair Cut", isPopular: true },
      { id: "haircut-head-shaving", name: "Head Shaving", category: "Hair Cut", isPopular: false },
      { id: "haircut-basic-shaving", name: "Basic Hair Cut & Shaving", category: "Hair Cut", isPopular: false },
      { id: "haircut-stylish-shaving", name: "Stylish Hair Cut & Shaving", category: "Hair Cut", isPopular: false },
    ]
  },
  {
    name: "Beard",
    services: [
      { id: "beard-shaving", name: "Shaving", category: "Beard", isPopular: true },
      { id: "beard-trim", name: "Beard Trim", category: "Beard", isPopular: true },
      { id: "beard-stylish", name: "Stylish Beard", category: "Beard", isPopular: false },
    ]
  },
  {
    name: "Facial",
    services: [
      { id: "facial-scrub-massage", name: "Scrub Massage", category: "Facial", isPopular: true },
      { id: "facial-oxy-bleach", name: "Oxy - Bleach", category: "Facial", isPopular: false },
      { id: "facial-de-tan", name: "De-Tan", category: "Facial", isPopular: false },
      { id: "facial-cleanup", name: "Face Clean Up", category: "Facial", isPopular: true },
      { id: "facial-whitening", name: "Face Whitening Facial", category: "Facial", isPopular: false },
      { id: "facial-gold", name: "Gold Facial", category: "Facial", isPopular: false },
      { id: "facial-diamond", name: "Diamond Facial", category: "Facial", isPopular: false },
      { id: "facial-premium-gold", name: "Premium Gold Facial", category: "Facial", isPopular: false },
      { id: "facial-premium-platinum", name: "Premium Platinum Facial", category: "Facial", isPopular: false },
      { id: "facial-premium-fruit", name: "Premium Fruit Facial", category: "Facial", isPopular: false },
    ]
  },
  {
    name: "Massage",
    services: [
      { id: "massage-head", name: "Head Massage", category: "Massage", isPopular: true },
      { id: "massage-menthol-oil", name: "Menthol Oil Massage", category: "Massage", isPopular: false },
      { id: "massage-almond-oil", name: "Almond Oil Massage", category: "Massage", isPopular: false },
    ]
  },
  {
    name: "Hair Color",
    services: [
      { id: "color-dye-service", name: "Dye Service", category: "Hair Color", isPopular: false },
      { id: "color-small-dye", name: "Small Dye", category: "Hair Color", isPopular: false },
      { id: "color-beard-dye", name: "Beard Dye", category: "Hair Color", isPopular: false },
      { id: "color-hair-dye", name: "Hair Dye", category: "Hair Color", isPopular: false },
      { id: "color-henna", name: "Henna", category: "Hair Color", isPopular: false },
      { id: "color-natural", name: "Natural Hair Dye", category: "Hair Color", isPopular: false },
      { id: "color-ammonia-free", name: "Ammonia Free Hair Color", category: "Hair Color", isPopular: false },
      { id: "color-streaking", name: "Hair Color Streaking", category: "Hair Color", isPopular: false },
    ]
  },
  {
    name: "Hair Spa",
    services: [
      { id: "spa-classic", name: "Classic Hair Spa", category: "Hair Spa", isPopular: false },
      { id: "spa-anti-dandruff", name: "Anti-dandruff Hair Spa", category: "Hair Spa", isPopular: false },
      { id: "spa-straightening", name: "Hair Straightening", category: "Hair Spa", isPopular: false },
    ]
  },
  {
    name: "Face Mask",
    services: [
      { id: "mask-charcoal", name: "Charcoal Face Mask", category: "Face Mask", isPopular: false },
      { id: "mask-orange", name: "Orange Face Mask", category: "Face Mask", isPopular: false },
    ]
  },
];

/**
 * Get service templates based on service category (gender)
 */
export function getServiceTemplates(serviceCategory: string): ServiceCategory[] {
  if (serviceCategory === 'gents') {
    return MENS_SERVICE_TEMPLATES;
  } else if (serviceCategory === 'ladies') {
    return LADIES_SERVICE_TEMPLATES;
  } else {
    // Unisex - combine both
    return [...MENS_SERVICE_TEMPLATES, ...LADIES_SERVICE_TEMPLATES];
  }
}

/**
 * Get only popular services for initial display
 */
export function getPopularServices(serviceCategory: string): ServiceCategory[] {
  const templates = getServiceTemplates(serviceCategory);
  return templates.map(category => ({
    ...category,
    services: category.services.filter(s => s.isPopular)
  })).filter(category => category.services.length > 0);
}

/**
 * Get only "more" (non-popular) services
 */
export function getMoreServices(serviceCategory: string): ServiceCategory[] {
  const templates = getServiceTemplates(serviceCategory);
  return templates.map(category => ({
    ...category,
    services: category.services.filter(s => !s.isPopular)
  })).filter(category => category.services.length > 0);
}

/**
 * Get all service categories with popular/more split for progressive expansion
 */
export function getAllServiceCategories(serviceCategory: string): ServiceCategory[] {
  return getServiceTemplates(serviceCategory);
}
