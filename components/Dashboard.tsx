import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Equipment, LubeRecord, LubeInventory, StockTransaction } from '../types';
import { getStatus, updateInventoryStock, addTransaction } from '../services/storageService';
import { AlertTriangle, CheckCircle, Clock, Droplets, Plus, Minus, User, History } from 'lucide-react';

interface DashboardProps {
  equipment: Equipment[];
  records: LubeRecord[];
  inventory: LubeInventory[];
  transactions: StockTransaction[];
  onInventoryUpdate: () => void;
}

interface StockModalProps {
  item: LubeInventory;
  type: 'IN' | 'OUT';
  onClose: () => void;
  onConfirm: (amount: number, user: string) => void;
}

const StockModal: React.FC<StockModalProps> = ({ item, type, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [user, setUser] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">{type === 'IN' ? '库存入库' : '领用登记'}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
                <p className="font-medium text-slate-700">{item.name} <span className="text-slate-400 font-normal">({item.type})</span></p>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">数量 ({item.unit})</label>
                    <input type="number" step="0.1" autoFocus
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.0" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">操作人</label>
                    <div className="relative">
                        <User size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
                        <input type="text" 
                            className="w-full border pl-8 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="姓名" value={user} onChange={e => setUser(e.target.value)} />
                    </div>
                </div>
                <div className="pt-2 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-200">取消</button>
                    <button 
                        onClick={() => onConfirm(parseFloat(amount), user)}
                        disabled={!amount || !user}
                        className={`flex-1 py-2 text-white rounded flex items-center justify-center gap-2 ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {type === 'IN' ? '确认入库' : '确认领用'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}

const COLORS = {
  OK: '#10B981', // green-500
  DUE: '#F59E0B', // amber-500
  OVERDUE: '#EF4444' // red-500
};

const Dashboard: React.FC<DashboardProps> = ({ equipment, records, inventory, transactions, onInventoryUpdate }) => {
  const [activeModal, setActiveModal] = useState<{item: LubeInventory, type: 'IN'|'OUT'} | null>(null);

  const stats = useMemo(() => {
    let ok = 0, due = 0, overdue = 0;
    equipment.forEach(eq => {
      const status = getStatus(eq.nextLubricated);
      if (status === 'OK') ok++;
      else if (status === 'DUE') due++;
      else overdue++;
    });
    return { ok, due, overdue, total: equipment.length };
  }, [equipment]);

  const pieData = [
    { name: '正常', value: stats.ok, color: COLORS.OK },
    { name: '今日到期', value: stats.due, color: COLORS.DUE },
    { name: '已逾期', value: stats.overdue, color: COLORS.OVERDUE },
  ].filter(d => d.value > 0);

  const activityData = useMemo(() => {
    // Last 7 days activity
    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date: date.slice(5), // MM-DD
      count: records.filter(r => r.date === date).length
    }));
  }, [records]);

  const handleStockUpdate = (amount: number, user: string) => {
      if (!activeModal) return;
      const { item, type } = activeModal;
      
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

      onInventoryUpdate();
      setActiveModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800">运营概览仪表盘</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">设备总数</p>
            <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <Droplets size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">今日到期</p>
            <p className="text-3xl font-bold text-amber-600">{stats.due}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">严重逾期</p>
            <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">近7天任务数</p>
            <p className="text-3xl font-bold text-emerald-600">{records.length}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Lubricant Inventory Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Droplets size={20} className="text-blue-600" />
            润滑油库存监控
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {inventory.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-slate-700">{item.name}</h4>
                            <p className="text-xs text-slate-400">{item.type}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.stock <= item.minThreshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {item.stock <= item.minThreshold ? '库存低' : '充足'}
                        </span>
                    </div>
                    <div className="flex items-end gap-1 mb-4">
                        <span className="text-3xl font-bold text-slate-800">{item.stock}</span>
                        <span className="text-sm text-slate-500 font-medium mb-1.5">{item.unit}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setActiveModal({item, type: 'IN'})}
                            className="flex-1 py-1.5 bg-green-50 text-green-700 rounded text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-1">
                            <Plus size={14} /> 入库
                        </button>
                        <button 
                            onClick={() => setActiveModal({item, type: 'OUT'})}
                            className="flex-1 py-1.5 bg-blue-50 text-blue-700 rounded text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                            <Minus size={14} /> 领用
                        </button>
                    </div>
                    {/* Low stock warning bar */}
                    {item.stock <= item.minThreshold && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
                    )}
                </div>
            ))}
        </div>
        
        {/* Recent Transactions List */}
        {transactions.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                    <History size={16} /> 最近出入库记录
                </h4>
                <div className="space-y-3">
                    {transactions.slice(0, 3).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${tx.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {tx.type === 'IN' ? '入' : '出'}
                                </span>
                                <div>
                                    <p className="text-slate-800 font-medium">{tx.inventoryName}</p>
                                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleString()} • {tx.user}</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-700">
                                {tx.type === 'IN' ? '+' : '-'}{tx.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">合规性状态</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[350px]">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">润滑活动趋势 (近7天)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="count" name="完成次数" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {activeModal && (
          <StockModal 
            item={activeModal.item} 
            type={activeModal.type} 
            onClose={() => setActiveModal(null)}
            onConfirm={handleStockUpdate} 
          />
      )}
    </div>
  );
};

export default Dashboard;