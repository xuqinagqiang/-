
import React, { useState, useMemo } from 'react';
import { LubeInventory, StockTransaction } from '../types';
import { saveInventory, updateInventoryStock, addTransaction, updateTransaction, deleteTransaction } from '../services/storageService';
import { Plus, Search, Edit2, Trash2, Download, Package, ArrowUpRight, ArrowDownLeft, X, Save, AlertTriangle } from 'lucide-react';

interface LubeStockManagerProps {
  inventory: LubeInventory[];
  transactions: StockTransaction[];
  onUpdate: () => void;
}

interface ItemModalProps {
  item: Partial<LubeInventory>;
  onClose: () => void;
  onSave: (item: LubeInventory) => void;
}

const ItemModal: React.FC<ItemModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<LubeInventory>>({
    name: '',
    type: '润滑油',
    stock: 0,
    unit: 'L',
    minThreshold: 10,
    ...item
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.unit) {
      onSave(formData as LubeInventory);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{item.id ? '编辑油品' : '添加新油品'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">油品名称</label>
            <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如: 壳牌液压油 S2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
            <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
               value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
               <option value="润滑油">润滑油 (Oil)</option>
               <option value="润滑脂">润滑脂 (Grease)</option>
               <option value="液压油">液压油 (Hydraulic)</option>
               <option value="齿轮油">齿轮油 (Gear)</option>
               <option value="其他">其他</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">库存数量</label>
              <input required type="number" step="0.1" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.stock} onChange={e => setFormData({...formData, stock: parseFloat(e.target.value)})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">单位</label>
              <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="kg, L, 桶" />
            </div>
          </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">低库存预警值</label>
              <input required type="number" step="1" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.minThreshold} onChange={e => setFormData({...formData, minThreshold: parseFloat(e.target.value)})} />
              <p className="text-xs text-slate-400 mt-1">低于此数值时将在仪表盘显示警告</p>
            </div>
          
          <div className="pt-2 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-200">取消</button>
             <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TransactionModalProps {
  item: LubeInventory;
  type: 'IN' | 'OUT';
  onClose: () => void;
  onConfirm: (amount: number, user: string) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ item, type, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">{type === 'IN' ? '库存入库' : '领用登记'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="font-medium text-slate-700">正在操作: {item.name}</p>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">数量 ({item.unit})</label>
                    <input type="number" step="0.1" autoFocus
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">操作人</label>
                    <input type="text" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="姓名" value={user} onChange={e => setUser(e.target.value)} />
                </div>
                <button 
                    onClick={() => onConfirm(parseFloat(amount), user)}
                    disabled={!amount || !user}
                    className={`w-full py-2 text-white rounded mt-2 ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    确认
                </button>
            </div>
        </div>
    </div>
  );
};

interface EditTransactionModalProps {
  transaction: StockTransaction;
  onClose: () => void;
  onSave: (tx: StockTransaction) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ transaction, onClose, onSave }) => {
  const [formData, setFormData] = useState<StockTransaction>({ ...transaction });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">编辑记录</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="font-medium text-slate-700">{formData.inventoryName}</p>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => setFormData({...formData, type: 'IN'})}
                          className={`flex-1 py-1.5 rounded text-sm font-medium ${formData.type === 'IN' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-slate-100 text-slate-600'}`}
                        >
                          入库
                        </button>
                        <button 
                          onClick={() => setFormData({...formData, type: 'OUT'})}
                          className={`flex-1 py-1.5 rounded text-sm font-medium ${formData.type === 'OUT' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-slate-100 text-slate-600'}`}
                        >
                          领用
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">数量</label>
                    <input type="number" step="0.1" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">操作人</label>
                    <input type="text" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">日期时间</label>
                    <input type="datetime-local" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={new Date(formData.date).toISOString().slice(0, 16)} 
                        onChange={e => setFormData({...formData, date: new Date(e.target.value).toISOString()})} />
                </div>

                <div className="pt-2 flex gap-3">
                  <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-200">取消</button>
                  <button 
                      onClick={() => onSave(formData)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                      保存修改
                  </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const LubeStockManager: React.FC<LubeStockManagerProps> = ({ inventory, transactions, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemModal, setActiveItemModal] = useState<Partial<LubeInventory> | null>(null);
  const [activeTransModal, setActiveTransModal] = useState<{item: LubeInventory, type: 'IN'|'OUT'} | null>(null);
  const [editingTx, setEditingTx] = useState<StockTransaction | null>(null);

  const filteredInventory = inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
        t.inventoryName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.user.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const handleSaveItem = (item: LubeInventory) => {
    let newInventory = [...inventory];
    if (item.id) {
        newInventory = newInventory.map(i => i.id === item.id ? item : i);
    } else {
        newInventory.push({ ...item, id: crypto.randomUUID() });
    }
    saveInventory(newInventory);
    onUpdate();
    setActiveItemModal(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('确定要删除该油品吗？删除后相关的历史记录仍会保留。')) {
        const newInventory = inventory.filter(i => i.id !== id);
        saveInventory(newInventory);
        onUpdate();
    }
  };

  const handleTransaction = (amount: number, user: string) => {
    if (!activeTransModal) return;
    const { item, type } = activeTransModal;
    const delta = type === 'IN' ? amount : -amount;
    
    updateInventoryStock(item.id, delta);
    addTransaction({
        id: crypto.randomUUID(),
        inventoryId: item.id,
        inventoryName: item.name,
        type,
        amount,
        date: new Date().toISOString(),
        user
    });
    
    onUpdate();
    setActiveTransModal(null);
  };

  const handleUpdateTransaction = (tx: StockTransaction) => {
    updateTransaction(tx);
    onUpdate();
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('确定要删除这条库存记录吗？库存数量将自动回滚。')) {
      deleteTransaction(id);
      onUpdate();
    }
  };

  const handleExportTransactions = () => {
    if (filteredTransactions.length === 0) {
        alert("没有记录可导出");
        return;
    }
    const headers = ["时间", "油品名称", "类型", "数量", "操作人"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => 
        `"${new Date(t.date).toLocaleString()}","${t.inventoryName}","${t.type === 'IN' ? '入库' : '领用'}","${t.amount}","${t.user}"`
      )
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `油品出入库记录_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h2 className="text-2xl font-bold text-slate-800">油品库存管理</h2>
            <p className="text-slate-500">管理润滑油种类、库存调整及查询流转记录</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveItemModal({})}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    添加新油品
                </button>
            </div>
        </div>

        {/* Global Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="搜索油品名称或操作人..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        {/* Section 1: Inventory List */}
        <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Package size={20} /> 库存列表
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative group hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                                <p className="text-xs text-slate-500">{item.type}</p>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => setActiveItemModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-slate-50"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-slate-50"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        
                        <div className="flex items-end gap-2 my-4">
                            <span className={`text-4xl font-bold ${item.stock <= item.minThreshold ? 'text-red-600' : 'text-slate-700'}`}>
                                {item.stock}
                            </span>
                            <span className="text-sm text-slate-500 font-medium mb-1.5">{item.unit}</span>
                            {item.stock <= item.minThreshold && (
                                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">
                                    <AlertTriangle size={12} /> 库存预警
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                             <button 
                                onClick={() => setActiveTransModal({item, type: 'IN'})}
                                className="flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-bold transition-colors">
                                <ArrowDownLeft size={16} /> 入库
                             </button>
                             <button 
                                onClick={() => setActiveTransModal({item, type: 'OUT'})}
                                className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-bold transition-colors">
                                <ArrowUpRight size={16} /> 领用
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Section 2: Transaction History */}
        <div className="pt-4">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Download size={20} /> 领用与入库记录
                </h3>
                <button 
                    onClick={handleExportTransactions}
                    className="flex items-center gap-1 text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
                >
                    <Save size={14} /> 导出表格
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600 text-sm">时间</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">类型</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">油品名称</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">数量</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">操作人</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 text-slate-500 text-sm">{new Date(tx.date).toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {tx.type === 'IN' ? '入库' : '领用'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-slate-800">{tx.inventoryName}</td>
                                    <td className="p-4 font-bold text-slate-700">
                                        {tx.type === 'IN' ? '+' : '-'}{tx.amount}
                                    </td>
                                    <td className="p-4 text-slate-600">{tx.user}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setEditingTx(tx)} 
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="修改记录"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTransaction(tx.id)} 
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="删除记录"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        没有相关的记录。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {activeItemModal && (
            <ItemModal 
                item={activeItemModal} 
                onClose={() => setActiveItemModal(null)}
                onSave={handleSaveItem} 
            />
        )}

        {activeTransModal && (
            <TransactionModal 
                item={activeTransModal.item}
                type={activeTransModal.type}
                onClose={() => setActiveTransModal(null)}
                onConfirm={handleTransaction}
            />
        )}

        {editingTx && (
            <EditTransactionModal 
                transaction={editingTx}
                onClose={() => setEditingTx(null)}
                onSave={handleUpdateTransaction}
            />
        )}
    </div>
  );
};

export default LubeStockManager;
