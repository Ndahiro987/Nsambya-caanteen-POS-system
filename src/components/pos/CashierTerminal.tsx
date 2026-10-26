import React, { useState, useMemo } from 'react';
import { MenuCategory, MenuItem, OrderItem, User } from '../../types/pos';
import { formatUGX, formatUGXShort } from '../../utils/formatters';
import { HOSPITAL_WARDS } from '../../services/storage';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  BookmarkPlus, 
  ChevronRight, 
  Building2, 
  Bed, 
  User as UserIcon, 
  FileText,
  Utensils,
  Coffee,
  Sandwich,
  Wine,
  HeartPulse,
  Cake,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface CashierTerminalProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  currentUser: User;
  heldOrders: {
    id: string;
    heldAt: string;
    label: string;
    items: OrderItem[];
    customerName?: string;
    ward?: string;
    bedNumber?: string;
  }[];
  onHoldOrder: (order: {
    items: OrderItem[];
    customerName?: string;
    ward?: string;
    bedNumber?: string;
  }) => void;
  onRecallOrder: (id: string) => void;
  onInitiateCheckout: (cartData: {
    items: OrderItem[];
    subtotal: number;
    total: number;
    ward: string;
    bedNumber: string;
    customerName: string;
    notes: string;
  }) => void;
}

export const CashierTerminal: React.FC<CashierTerminalProps> = ({
  categories,
  menuItems,
  currentUser,
  heldOrders,
  onHoldOrder,
  onRecallOrder,
  onInitiateCheckout
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryOnly, setDietaryOnly] = useState<boolean>(false);

  // Delivery metadata
  const [selectedWard, setSelectedWard] = useState<string>('Main Canteen (Walk-in)');
  const [bedNumber, setBedNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [showHeldDrawer, setShowHeldDrawer] = useState<boolean>(false);

  // Current Cart
  const [cart, setCart] = useState<OrderItem[]>([]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.active) return false;
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (dietaryOnly && !item.isDietary) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code?.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryOnly, searchQuery]);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!item.inStock) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPriceSnapshot }
            : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          itemNameSnapshot: item.name,
          quantity: 1,
          unitPriceSnapshot: item.currentPrice,
          lineTotal: item.currentPrice
        }
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return {
              ...i,
              quantity: newQty,
              lineTotal: newQty * i.unitPriceSnapshot
            };
          }
          return i;
        })
        .filter(i => i.quantity > 0);
    });
  };

  const removeItem = (menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setBedNumber('');
    setOrderNotes('');
  };

  const handleHoldCurrent = () => {
    if (cart.length === 0) return;
    onHoldOrder({
      items: cart,
      customerName,
      ward: selectedWard,
      bedNumber
    });
    clearCart();
  };

  const handleResumeHeld = (held: typeof heldOrders[0]) => {
    setCart(held.items);
    if (held.customerName) setCustomerName(held.customerName);
    if (held.ward) setSelectedWard(held.ward);
    if (held.bedNumber) setBedNumber(held.bedNumber);
    onRecallOrder(held.id);
    setShowHeldDrawer(false);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.lineTotal, 0);
  }, [cart]);

  const total = subtotal; // Hospital dining meals exempt from VAT (0%)

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    onInitiateCheckout({
      items: cart,
      subtotal,
      total,
      ward: selectedWard,
      bedNumber,
      customerName,
      notes: orderNotes
    });
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'cat_hot_meals': return <Utensils className="w-4 h-4" />;
      case 'cat_breakfast': return <Coffee className="w-4 h-4" />;
      case 'cat_fast_bites': return <Sandwich className="w-4 h-4" />;
      case 'cat_drinks': return <Wine className="w-4 h-4" />;
      case 'cat_dietary': return <HeartPulse className="w-4 h-4" />;
      case 'cat_bakery': return <Cake className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN: Catalog, Wards & Menu (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Hospital Ward / Delivery Location Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Hospital Dining & Delivery Destination</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Cashier: <span className="font-bold text-slate-700">{currentUser.fullName}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <label className="text-[11px] text-slate-500 font-medium block mb-1">Ward / Department</label>
              <select
                value={selectedWard}
                onChange={e => setSelectedWard(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {HOSPITAL_WARDS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] text-slate-500 font-medium block mb-1">Bed / Room No.</label>
              <div className="relative">
                <input
                  type="text"
                  value={bedNumber}
                  onChange={e => setBedNumber(e.target.value)}
                  placeholder="e.g. Bed 4B"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] text-slate-500 font-medium block mb-1">Doctor / Patient Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Optional Name"
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search food, tea, rolex..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setDietaryOnly(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                dietaryOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Patient Diets</span>
            </button>

            {heldOrders.length > 0 && (
              <button
                onClick={() => setShowHeldDrawer(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Held ({heldOrders.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (Segmented interactive buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Menu Items ({menuItems.filter(m => m.active).length})
          </button>
          {categories.filter(c => c.active).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredItems.map(item => {
            const inCart = cart.find(i => i.menuItemId === item.id);
            return (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className={`relative bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all select-none group text-left ${
                  !item.inStock
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : inCart
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer active:scale-98'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      {item.code || 'ITEM'}
                    </span>
                    {item.isDietary && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                        Dietary
                      </span>
                    )}
                    {!item.inStock && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900 font-mono tabular-nums">
                    {formatUGX(item.currentPrice)}
                  </span>
                  {inCart ? (
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono">
                      {inCart.quantity}
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 font-bold text-xs flex items-center justify-center transition-colors">
                      +
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No items match your filter</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the search or category filter</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); setDietaryOnly(false); }}
                className="mt-3 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Live Order Cart & Checkout (5 cols) */}
      <div className="lg:col-span-5 sticky top-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-6rem)] max-h-[820px]">
          
          {/* Cart Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Active Order Cart</span>
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <>
                  <button
                    onClick={handleHoldCurrent}
                    title="Hold order to attend next customer in queue"
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <BookmarkPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearCart}
                    title="Clear order"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Delivery Target Preview */}
          <div className="bg-emerald-50/60 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div className="truncate pr-2">
              <span className="font-bold">{selectedWard}</span>
              {bedNumber && <span className="ml-1 text-emerald-800">({bedNumber})</span>}
              {customerName && <span className="ml-1 text-slate-600">· {customerName}</span>}
            </div>
            <span className="text-[10px] text-emerald-700 bg-white border border-emerald-200 px-1.5 py-0.5 rounded-md font-mono shrink-0">
              Tax Exempt (0%)
            </span>
          </div>

          {/* Cart Line Items */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
            {cart.map(item => (
              <div key={item.menuItemId} className="pt-2 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 leading-snug truncate">
                      {item.itemNameSnapshot}
                    </h5>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      {formatUGX(item.unitPriceSnapshot)} each
                    </div>
                  </div>
                  <div className="text-right font-black text-xs text-slate-900 font-mono tabular-nums shrink-0">
                    {formatUGX(item.lineTotal)}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-xs font-mono tabular-nums text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                      className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition-colors shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Utensils className="w-10 h-10 text-slate-200 mb-2 stroke-[1.5]" />
                <p className="font-bold text-sm text-slate-700">Order Cart is Empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                  Click items on the left to start billing food and drinks
                </p>
              </div>
            )}
          </div>

          {/* Special Kitchen / Tray Notes */}
          {cart.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Optional kitchen note (e.g. extra soup, separate pack)"
                className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Cart Footer & Primary Charge CTA */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal:</span>
                <span className="font-mono tabular-nums">{formatUGX(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hospital Meal VAT (0% Exempt):</span>
                <span className="font-mono tabular-nums">UGX 0</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>TOTAL DUE:</span>
                <span className="font-mono text-xl tabular-nums text-emerald-700">{formatUGX(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <span>Charge {cart.length > 0 ? formatUGXShort(total) : 'UGX 0'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Held Orders Drawer Modal */}
      {showHeldDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900">Held Orders Queue</h3>
              </div>
              <button onClick={() => setShowHeldDrawer(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {heldOrders.map(held => {
                const heldTotal = held.items.reduce((s, i) => s + i.lineTotal, 0);
                return (
                  <div key={held.id} className="p-3 border rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{held.label}</div>
                      <div className="text-[11px] text-slate-500">
                        {held.items.length} items · {formatUGX(heldTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{held.ward || 'Main Canteen'}</div>
                    </div>
                    <button
                      onClick={() => handleResumeHeld(held)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Resume
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowHeldDrawer(false)}
              className="w-full py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
