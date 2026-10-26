import { POSState, MenuCategory, MenuItem } from '../types/pos';

const STORAGE_KEY = 'nsambya_canteen_pos_prod_v2';

export const INITIAL_CATEGORIES: MenuCategory[] = [
  { id: 'cat_hot_meals', name: 'Hot Meals & Local Specials', description: 'Freshly prepared hearty traditional & modern lunch dishes', active: true, sortOrder: 1 },
  { id: 'cat_breakfast', name: 'Breakfast & Hot Beverages', description: 'Morning teas, porridge, coffee and warm energy boosters', active: true, sortOrder: 2 },
  { id: 'cat_fast_bites', name: 'Fast Bites & Rolex Corner', description: 'Ugandan Rolex, soft chapatis, beef sausages & crunchy samosas', active: true, sortOrder: 3 },
  { id: 'cat_drinks', name: 'Cold Drinks & Fresh Juices', description: 'Fresh passion juice, mineral waters, natural juices and sodas', active: true, sortOrder: 4 },
  { id: 'cat_dietary', name: 'Patient & Recovery Diets', description: 'Low-sodium, steamed, easily digestible meals for wards and recovery', active: true, sortOrder: 5 },
  { id: 'cat_bakery', name: 'Bakery & Light Snacks', description: 'Pastries, hard boiled eggs, queen cakes and fresh dairy yoghurts', active: true, sortOrder: 6 }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item_001',
    categoryId: 'cat_fast_bites',
    name: 'Famous Rolex Special (2 Eggs + Chapati)',
    description: 'Hot rolled chapati with fluffy fried eggs, chopped tomatoes, shredded cabbage and sweet red onions.',
    currentPrice: 4500,
    active: true,
    inStock: true,
    code: 'RLX-01'
  },
  {
    id: 'item_002',
    categoryId: 'cat_hot_meals',
    name: 'Steamed Matooke & Beef Luwombo',
    description: 'Tender beef slow-steamed in traditional banana leaves with aromatic spices, served with soft mashed green bananas (matooke).',
    currentPrice: 16000,
    active: true,
    inStock: true,
    code: 'LWB-BF'
  },
  {
    id: 'item_003',
    categoryId: 'cat_hot_meals',
    name: 'Katogo with Tender Beef & Matooke',
    description: 'Steamed plantains simmered with seasoned cubed beef in rich onion gravy.',
    currentPrice: 10000,
    active: true,
    inStock: true,
    code: 'KTG-BF'
  },
  {
    id: 'item_004',
    categoryId: 'cat_hot_meals',
    name: 'Steamed Rice with Fresh Fried Chicken',
    description: 'Seasoned chicken served with fluffy white rice, fresh coleslaw and thick brown gravy.',
    currentPrice: 14000,
    active: true,
    inStock: true,
    code: 'RC-CHK'
  },
  {
    id: 'item_005',
    categoryId: 'cat_hot_meals',
    name: 'Spiced Pilau Rice with Beef Stew',
    description: 'East African spiced basmati pilau cooked with cumin, cardamom and garlic, accompanied by slow-cooked beef chunks.',
    currentPrice: 12500,
    active: true,
    inStock: true,
    code: 'PLU-01'
  },
  {
    id: 'item_006',
    categoryId: 'cat_hot_meals',
    name: 'Golden Fried Chicken & Potato Chips',
    description: 'Deep-fried golden chicken quarter served with hot hand-cut potato chips, tomato sauce and crisp side salad.',
    currentPrice: 15000,
    active: true,
    inStock: true,
    code: 'CHK-CHP'
  },
  {
    id: 'item_007',
    categoryId: 'cat_breakfast',
    name: 'Spiced African Milk Tea (Chai Dawa)',
    description: 'Rich boiling milk infused with ginger, cloves, cinnamon and premium Ugandan black tea leaves.',
    currentPrice: 3500,
    active: true,
    inStock: true,
    code: 'TEA-AFR'
  },
  {
    id: 'item_008',
    categoryId: 'cat_breakfast',
    name: 'Fresh Dawa Health Infusion',
    description: 'Warm recovery tea brewed with fresh lemon slices, ginger root, garlic hint and natural honey.',
    currentPrice: 4000,
    active: true,
    inStock: true,
    code: 'TEA-DWA'
  },
  {
    id: 'item_009',
    categoryId: 'cat_fast_bites',
    name: 'Crunchy Beef Samosas (Pair of 2)',
    description: 'Golden crispy pastry pockets filled with spiced minced lean beef, peas and fresh spring onions.',
    currentPrice: 3000,
    active: true,
    inStock: true,
    code: 'SMS-02'
  },
  {
    id: 'item_010',
    categoryId: 'cat_fast_bites',
    name: 'Soft Layered Plain Chapati',
    description: 'Pan-fried layered wheat flatbread made fresh daily.',
    currentPrice: 1500,
    active: true,
    inStock: true,
    code: 'CHP-01'
  },
  {
    id: 'item_011',
    categoryId: 'cat_drinks',
    name: 'Fresh Cold-Pressed Passion Fruit Juice (500ml)',
    description: 'Pure Masaka passion fruit juice, naturally sweet and refreshingly chilled.',
    currentPrice: 4000,
    active: true,
    inStock: true,
    code: 'JUC-PAS'
  },
  {
    id: 'item_012',
    categoryId: 'cat_drinks',
    name: 'Rwenzori Pure Natural Mineral Water (500ml)',
    description: 'Chilled sealed mineral spring water bottled at source in the Rwenzori mountains.',
    currentPrice: 1500,
    active: true,
    inStock: true,
    code: 'WTR-500'
  },
  {
    id: 'item_013',
    categoryId: 'cat_dietary',
    name: 'Steamed Tilapia Fillet & Boiled Greens',
    description: 'Doctor-recommended light poached Nile Tilapia in light ginger broth with steamed greens and sweet pumpkin.',
    currentPrice: 14000,
    active: true,
    inStock: true,
    code: 'REC-TLP',
    isDietary: true
  },
  {
    id: 'item_014',
    categoryId: 'cat_dietary',
    name: 'Millet & Soy Recovery Porridge',
    description: 'Smooth, nourishing warm porridge made from organic finger millet and roasted soy flour.',
    currentPrice: 3000,
    active: true,
    inStock: true,
    code: 'REC-MLT',
    isDietary: true
  }
];

export const HOSPITAL_WARDS = [
  'Main Canteen (Walk-in)',
  'St. Francis Surgical Ward',
  'Mother Kevin Maternity Ward',
  'St. Joseph Pediatric Ward',
  'St. Luke Medical Ward',
  'On-Duty Doctors & Nurses Lounge',
  'Private Wing - Room St. Jude',
  'Intensive Care Unit (ICU Visitor)',
  'Outpatient Clinic (OPD Waiting)',
  'Hospital Administration Block'
];

export function getCleanPOSState(): POSState {
  return {
    users: [], // Zero demo users! Prompts admin setup
    categories: INITIAL_CATEGORIES,
    menuItems: INITIAL_MENU_ITEMS,
    orders: [], // Zero demo orders
    payments: [], // Zero demo payments
    receipts: [], // Zero demo receipts
    saleCorrections: [], // Zero demo corrections
    cashClosings: [], // Zero demo closings
    auditLogs: [], // Zero demo logs
    signupRequests: [], // Zero demo signups
    currentUser: null, // Logged out
    heldOrders: []
  };
}

export function loadPOSState(): POSState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const clean = getCleanPOSState();
      savePOSState(clean);
      return clean;
    }
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      categories: parsed.categories?.length ? parsed.categories : INITIAL_CATEGORIES,
      menuItems: parsed.menuItems?.length ? parsed.menuItems : INITIAL_MENU_ITEMS,
      orders: parsed.orders || [],
      payments: parsed.payments || [],
      receipts: parsed.receipts || [],
      saleCorrections: parsed.saleCorrections || [],
      cashClosings: parsed.cashClosings || [],
      auditLogs: parsed.auditLogs || [],
      signupRequests: parsed.signupRequests || [],
      currentUser: parsed.currentUser || null,
      heldOrders: parsed.heldOrders || []
    };
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getCleanPOSState();
  }
}

export function savePOSState(state: POSState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save POS state:', err);
  }
}

export function wipeAllData(): POSState {
  const clean = getCleanPOSState();
  savePOSState(clean);
  return clean;
}
