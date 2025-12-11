import React, { useMemo, useState } from 'react';
import { Equipment } from '../types';
import { getStatus, saveEquipment, saveRecord, calculateNextDate } from '../services/storageService';
import { Download, CheckSquare, Calendar, AlertCircle, X, Save, User } from 'lucide-react';

interface DailyScheduleProps {
  equipment: Equipment[];
  onUpdate: () => void;
}

interface CompletionModalProps {
  equipment: Equipment;
  onClose: () => void;
  onConfirm: (performDate: string, nextDate: string, notes: string, performer: string) => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ equipment, onClose, onConfirm }) => {
  const today = new Date().toISOString().split('T')[0];
  const [performDate, setPerformDate] = useState(today);
  const [nextDate, setNextDate] = useState(calculateNextDate(today, equipment.cycleDays));
  const [notes, setNotes] = useState('');
  const [performer, setPerformer] = useState('');

  // Auto-calculate next date when perform date changes
  const handlePerformDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setPerformDate(newDate);
    setNextDate(calculateNextDate(newDate, equipment.cycleDays));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">完成润滑任务</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">设备名称</p>
            <p className="font-medium text-slate-800 text-lg">{equipment.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">实际润滑日期</label>
                <input 
                  type="date" 
                  value={performDate} 
                  onChange={handlePerformDateChange}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">执行人</label>
                <div className="relative">
                  <User size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={performer}
                    onChange={(e) => setPerformer(e.target.value)}
                    placeholder="请输入姓名"
                    className="w-full border pl-8 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">下次计划日期 (自动计算)</label>
            <input 
              type="date" 
              value={nextDate} 
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
            />
            <p className="text-xs text-slate-400 mt-1">周期: {equipment.cycleDays} 天 (若不修改则自动顺延)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注 (可选)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录油品状况、异常情况等..."
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
              onClick={() => onConfirm(performDate, nextDate, notes, performer)}
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              确认记录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DailySchedule: React.FC<DailyScheduleProps> = ({ equipment, onUpdate }) => {
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const today = new Date().toISOString().split('T')[0];

  const dueItems = useMemo(() => {
    return equipment.filter(eq => eq.nextLubricated <= today).sort((a, b) => a.nextLubricated.localeCompare(b.nextLubricated));
  }, [equipment, today]);

  const handleExport = () => {
    if (dueItems.length === 0) {
      alert("今日没有需要导出的任务。");
      return;
    }

    // Export format designed for printing and manual checking
    const headers = [
      "状态", 
      "设备名称", 
      "安装位置", 
      "润滑部位/类型", 
      "润滑油品", 
      "加注量", 
      "计划截止日期", 
      "实际执行时间 (填写)", // Empty for manual entry
      "执行人签字", // Empty for signature
      "异常情况备注", // Empty for notes
      "完成确认(√)" // Empty for checkmark
    ];

    const csvContent = [
      headers.join(","),
      ...dueItems.map(item => {
        const status = getStatus(item.nextLubricated) === 'OVERDUE' ? '已逾期' : '今日到期';
        // We leave empty strings for the columns that need manual filling
        return `"${status}","${item.name}","${item.location}","${item.type}","${item.lubricant}","${item.capacity}","${item.nextLubricated}","","","",""`;
      })
    ].join("\n");

    // Add BOM for Excel compatibility with Chinese characters
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `润滑作业工单_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCompleteConfirm = (performDate: string, nextDate: string, notes: string, performer: string) => {
    if (!selectedEq) return;

    const record = {
      id: crypto.randomUUID(),
      equipmentId: selectedEq.id,
      equipmentName: selectedEq.name,
      date: performDate,
      performedBy: performer || '未记录',
      notes: notes || '常规润滑'
    };
    saveRecord(record);

    const updatedEq = {
      ...selectedEq,
      lastLubricated: performDate,
      nextLubricated: nextDate
    };
    
    // Update master list
    const newList = equipment.map(item => item.id === selectedEq.id ? updatedEq : item);
    saveEquipment(newList);
    onUpdate();
    setSelectedEq(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">每日计划</h2>
          <p className="text-slate-500">今日任务清单与作业工单 ({today})</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Download size={18} />
          导出作业工单 (Excel)
        </button>
      </div>

      {dueItems.length === 0 ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
          <CheckSquare className="mx-auto text-green-500 mb-3" size={48} />
          <h3 className="text-lg font-medium text-green-800">任务已全部完成！</h3>
          <p className="text-green-600">今天没有待处理的润滑任务。</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600 text-sm">状态</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">设备信息</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">位置</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">润滑要求</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm hidden md:table-cell">计划截止</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueItems.map(item => {
                  const status = getStatus(item.nextLubricated);
                  const isOverdue = status === 'OVERDUE';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                          {isOverdue ? '已逾期' : '今日到期'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 md:hidden">{item.location}</div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-slate-600">{item.location}</td>
                      <td className="p-4 text-slate-600">
                        <div className="text-sm">{item.lubricant}</div>
                        <div className="text-xs text-slate-400">容量: {item.capacity}</div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-slate-600 text-sm">{item.nextLubricated}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedEq(item)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                          完成任务
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedEq && (
        <CompletionModal 
          equipment={selectedEq} 
          onClose={() => setSelectedEq(null)} 
          onConfirm={handleCompleteConfirm} 
        />
      )}
    </div>
  );
};

export default DailySchedule;