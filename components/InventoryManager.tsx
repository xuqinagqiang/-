import React, { useState } from 'react';
import { Equipment } from '../types';
import { saveEquipment, calculateNextDate } from '../services/storageService';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

interface InventoryManagerProps {
  equipment: Equipment[];
  onUpdate: () => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ equipment, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Omit<Equipment, 'id' | 'nextLubricated'> = {
    name: '',
    type: '电机',
    location: '',
    lubricant: '',
    cycleDays: 30,
    lastLubricated: new Date().toISOString().split('T')[0],
    capacity: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredEquipment = equipment.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nextLubricated = calculateNextDate(formData.lastLubricated, formData.cycleDays);

    let updatedList: Equipment[];
    if (editingId) {
      updatedList = equipment.map(item => 
        item.id === editingId 
          ? { ...formData, id: editingId, nextLubricated } 
          : item
      );
    } else {
      const newItem: Equipment = {
        ...formData,
        id: crypto.randomUUID(),
        nextLubricated
      };
      updatedList = [...equipment, newItem];
    }

    saveEquipment(updatedList);
    onUpdate();
    handleCloseModal();
  };

  const handleEdit = (item: Equipment) => {
    setFormData({
      name: item.name,
      type: item.type,
      location: item.location,
      lubricant: item.lubricant,
      cycleDays: item.cycleDays,
      lastLubricated: item.lastLubricated,
      capacity: item.capacity,
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除该设备吗?')) {
      const updatedList = equipment.filter(item => item.id !== id);
      saveEquipment(updatedList);
      onUpdate();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">设备台账</h2>
          <p className="text-slate-500">管理设备资产及润滑参数</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          添加设备
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="搜索设备名称、类型或位置..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600 text-sm">设备名称</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">类型</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">位置</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">周期 (天)</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">润滑剂/量</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipment.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4 text-slate-600">{item.type}</td>
                  <td className="p-4 text-slate-600">{item.location}</td>
                  <td className="p-4 text-slate-600">{item.cycleDays}</td>
                  <td className="p-4 text-slate-600">{item.lubricant} <span className="text-xs text-slate-400">({item.capacity})</span></td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">未找到匹配的设备。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? '编辑设备' : '添加新设备'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">设备名称</label>
                <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                  <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="电机">电机 (Motor)</option>
                    <option value="泵">泵 (Pump)</option>
                    <option value="齿轮箱">齿轮箱 (Gearbox)</option>
                    <option value="轴承">轴承 (Bearing)</option>
                    <option value="链条">链条 (Chain)</option>
                    <option value="其他">其他 (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">位置/区域</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">润滑剂型号</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.lubricant} onChange={e => setFormData({...formData, lubricant: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">加注量/容量</label>
                  <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例如: 50g"
                    value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">润滑周期 (天)</label>
                  <input required type="number" min="1" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.cycleDays} onChange={e => setFormData({...formData, cycleDays: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">上次润滑日期</label>
                  <input required type="date" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.lastLubricated} onChange={e => setFormData({...formData, lastLubricated: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={3}
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存设备</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;