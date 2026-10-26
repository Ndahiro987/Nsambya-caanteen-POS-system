import React, { useState } from 'react';
import { MenuCategory, MenuItem, User } from '../../types/pos';
import { formatUGX } from '../../utils/formatters';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Search, 
  AlertCircle,
  Tag,
  Power,
  HeartPulse
} from 'lucide-react';

interface MenuManagementViewProps {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  currentUser: User;
  onUpdateItemPrice: (itemId: string, newPrice: number, reason: string) => void;
  onToggleItemStock: (itemId: string, inStock: boolean) => void;
  onAddItem: (item: Omit<MenuItem, 'id'>) => void;
  onAddCategory: (category: Omit<MenuCategory, 'id'>) => void;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  categories,
  menuItems,
  currentUser,
  onUpdateItemPrice,
  onToggleItemStock,
  onAddItem,
  onAddCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Editing price modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState<string>('');

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>(categories[0]?.id || '');
  const [newItemPrice, setNewItemPrice] = useState<number>(5000);
  const [newItemCode, setNewItemCode] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemDietary, setNewItemDietary] = useState<boolean>(false);

  // Add Category Modal
  const [isAddCatOpen, setIsAddCatOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatDesc, setNewCatDesc] = useState<string>('');

  const filteredItems = menuItems.filter(item => {
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.code?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleOpenPriceEdit = (item: MenuItem) => {
    setEditingItem(item);
    setNewPrice(item.currentPrice);
    setPriceChangeReason('');
  };

  const handleSavePriceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || newPrice <= 0) return;
    onUpdateItemPrice(
      editingItem.id,
      newPrice,
      priceChangeReason || `Price updated by ${currentUser.fullName}`
    );
    setEditingItem(null);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemPrice <= 0) return;

    onAddItem({
      name: newItemName.trim(),
      categoryId: newItemCategory,
      currentPrice: newItemPrice,
      code: newItemCode.trim().toUpperCase() || 'DISH',
      description: newItemDesc.trim(),
      active: true,
      inStock: true,
      isDietary: newItemDietary
    });

    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemCode('');
    setNewItemDesc('');
    setNewItemDietary(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      active: true,
      sortOrder: categories.length + 1
    });

    setIsAddCatOpen(false);
    setNewCatName('');
    setNewCatDesc('');
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span>Kitchen & Menu Management</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">Canteen Menu, Inventory & Pricing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure dish availability, 86 out-of-stock items, and manage Ugandan Shilling pricing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddCatOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Food / Drink Item</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items by name or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Categories segmented buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({menuItems.length})
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Dish / Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Price (UGX)</th>
                <th className="py-3 px-4 text-center">In-Stock State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const cat = categories.find(c => c.id === item.categoryId);

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {item.code || 'ITEM'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {item.name}
                        {item.isDietary && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-normal flex items-center gap-0.5">
                            <HeartPulse className="w-2.5 h-2.5" /> Dietary
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {cat?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono tabular-nums text-slate-900 text-sm">
                      {formatUGX(item.currentPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleItemStock(item.id, !item.inStock)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          item.inStock
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{item.inStock ? 'Available' : 'Sold Out (86)'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenPriceEdit(item)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Price</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Price Adjustment</span>
                <h3 className="font-bold text-base text-slate-900">{editingItem.name}</h3>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSavePriceEdit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">New Price (UGX)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono font-bold">UGX</span>
                  <input
                    type="number"
                    step="500"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(Number(e.target.value))}
                    className="w-full pl-14 pr-3 py-2 text-base font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason for Price Update (Logged in Audit)</label>
                <input
                  type="text"
                  value={priceChangeReason}
                  onChange={e => setPriceChangeReason(e.target.value)}
                  placeholder="e.g. Market produce price adjustment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Add New Dish / Canteen Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Item Code</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={e => setNewItemCode(e.target.value)}
                    placeholder="e.g. KTG-02"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dish / Item Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="e.g. Beef Katogo with Fresh Matooke"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Price (UGX) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  step="500"
                  required
                  value={newItemPrice}
                  onChange={e => setNewItemPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  placeholder="Ingredients, preparation and serving details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="dietary"
                  checked={newItemDietary}
                  onChange={e => setNewItemDietary(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="dietary" className="text-xs font-semibold text-slate-700">
                  Tag as Patient Recovery / Dietary Meal (Soft, Low-Sodium)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Add Menu Category</h3>
              <button onClick={() => setIsAddCatOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="e.g. Desserts & Fruit Salads"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Brief overview..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddCatOpen(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
