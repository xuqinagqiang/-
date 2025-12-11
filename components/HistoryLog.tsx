
import React, { useState, useMemo } from 'react';
import { Equipment, LubeRecord } from '../types';
import { updateRecord, deleteRecord } from '../services/storageService';
import { Download, Filter, Calendar, User, FileText, Search, History as HistoryIcon, Edit2, X, Save, Trash2 } from 'lucide-react';

interface HistoryLogProps {
  records: LubeRecord[];
  equipment: Equipment[];
  onUpdate: () => void; // Callback to refresh parent state
}

interface EditRecordModalProps {
  record: LubeRecord;
  onClose: () => void;
  onSave: (updatedRecord: LubeRecord) => void;
}

const EditRecordModal: React.FC<EditRecordModalProps> = ({ record, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...record });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">修改润滑记录</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">设备名称</p>
            <p className="font-medium text-slate-800 text-lg">{formData.equipmentName}</p>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">润滑日期</label>
             <input 
               type="date" 
               value={formData.date} 
               onChange={(e) => setFormData({...formData, date: e.target.value})}
               className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">执行人</label>
             <input 
               type="text" 
               value={formData.performedBy}
               onChange={(e) => setFormData({...formData, performedBy: e.target.value})}
               className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
             />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-200"
            >
              取消
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              保存修改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryLog: React.FC<HistoryLogProps> = ({ records, equipment, onUpdate }) => {
  const [selectedEqId, setSelectedEqId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<LubeRecord | null>(null);

  // Combine filters
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesEq = selectedEqId === 'all' || record.equipmentId === selectedEqId;
      const matchesSearch = 
        record.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesEq && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort desc
  }, [records, selectedEqId, searchTerm]);

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      alert("没有可导出的记录。");
      return;
    }

    const headers = ["日期", "设备名称", "执行人", "备注"];
    const csvContent = [
      headers.join(","),
      ...filteredRecords.map(r => 
        `"${r.date}","${r.equipmentName}","${r.performedBy}","${r.notes.replace(/"/g, '""')}"`
      )
    ].join("\n");

    const bom = "\uFEFF"; // Add BOM for Chinese Excel support
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `润滑历史记录_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = (updatedRecord: LubeRecord) => {
    updateRecord(updatedRecord);
    setEditingRecord(null);
    onUpdate(); // Refresh data in App
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条历史记录吗？此操作无法撤销。')) {
        deleteRecord(id);
        onUpdate();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">历史记录与时间线</h2>
          <p className="text-slate-500">查看设备维护档案及导出报表</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Download size={18} />
          导出记录
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索备注、执行人..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:w-64 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={selectedEqId}
            onChange={(e) => setSelectedEqId(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="all">显示所有设备</option>
            {equipment.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline / List View */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <HistoryIcon size={48} className="mb-4 opacity-50" />
            <p>没有找到相关的历史记录。</p>
          </div>
        ) : (
          <div className="p-6">
             {selectedEqId !== 'all' && (
                <div className="mb-6 pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        {equipment.find(e => e.id === selectedEqId)?.name} 
                        <span className="text-sm font-normal text-slate-500">维护时间线</span>
                    </h3>
                </div>
             )}

            <div className="space-y-0 relative">
              {/* Vertical line for timeline view when filtered */}
              {selectedEqId !== 'all' && (
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>
              )}

              {filteredRecords.map((record, index) => (
                <div key={record.id} className={`relative flex gap-4 pb-8 last:pb-0 ${selectedEqId !== 'all' ? 'pl-8' : ''}`}>
                  
                  {/* Timeline dot */}
                  {selectedEqId !== 'all' && (
                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm z-10"></div>
                  )}

                  <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-100 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{record.equipmentName}</span>
                        {selectedEqId === 'all' && (
                            <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
                                {record.equipmentId === '1' ? 'A区' : record.equipmentId === '2' ? '泵房' : '生产线'}
                            </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mr-2">
                            <Calendar size={14} />
                            <span>{record.date}</span>
                        </div>
                        <button 
                            onClick={() => setEditingRecord(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="修改记录"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button 
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="删除记录"
                        >
                            <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="text-slate-600 text-sm flex items-start gap-2">
                        <FileText size={14} className="mt-0.5 shrink-0 text-slate-400" />
                        <span>{record.notes || "无备注"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <User size={12} />
                        <span>执行人: {record.performedBy}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingRecord && (
        <EditRecordModal 
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default HistoryLog;
