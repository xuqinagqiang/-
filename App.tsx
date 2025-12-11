
import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import { getStoredEquipment, getStoredRecords, getStoredInventory, getStoredTransactions } from './services/storageService';
import Dashboard from './components/Dashboard';
import InventoryManager from './components/InventoryManager';
import DailySchedule from './components/DailySchedule';
import AiAssistant from './components/AiAssistant';
import HistoryLog from './components/HistoryLog';
import LubeStockManager from './components/LubeStockManager';
import SOPManager from './components/SOPManager';
import { LayoutDashboard, Database, CalendarCheck, History, Menu, X, Sparkles, Droplet, Package, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [equipment, setEquipment] = useState(getStoredEquipment());
  const [records, setRecords] = useState(getStoredRecords());
  const [inventory, setInventory] = useState(getStoredInventory());
  const [transactions, setTransactions] = useState(getStoredTransactions());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshData = () => {
    setEquipment(getStoredEquipment());
    setRecords(getStoredRecords());
    setInventory(getStoredInventory());
    setTransactions(getStoredTransactions());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const NavItem = ({ target, icon: Icon, label }: { target: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(target);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        view === target 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Droplet size={24} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">智能润滑管理</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem target="dashboard" icon={LayoutDashboard} label="概览仪表盘" />
          <NavItem target="schedule" icon={CalendarCheck} label="每日计划" />
          <NavItem target="inventory" icon={Database} label="设备台账" />
          <NavItem target="stock" icon={Package} label="油品库存" />
          <NavItem target="sop" icon={BookOpen} label="标准作业" />
          <NavItem target="history" icon={History} label="历史记录" />
          <NavItem target="assistant" icon={Sparkles} label="智能助手" />
        </nav>

        <div className="p-4 border-t border-slate-100">
           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
             <p className="text-xs text-slate-500 font-medium">系统状态</p>
             <div className="flex items-center gap-2 mt-1">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-xs text-slate-700">在线 • 本地存储</span>
             </div>
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
           <div className="bg-blue-600 p-1.5 rounded text-white">
            <Droplet size={20} fill="currentColor" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">智能润滑管理</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4 space-y-2">
          <NavItem target="dashboard" icon={LayoutDashboard} label="概览仪表盘" />
          <NavItem target="schedule" icon={CalendarCheck} label="每日计划" />
          <NavItem target="inventory" icon={Database} label="设备台账" />
          <NavItem target="stock" icon={Package} label="油品库存" />
          <NavItem target="sop" icon={BookOpen} label="标准作业" />
          <NavItem target="history" icon={History} label="历史记录" />
          <NavItem target="assistant" icon={Sparkles} label="智能助手" />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {view === 'dashboard' && (
            <Dashboard 
                equipment={equipment} 
                records={records} 
                inventory={inventory}
                transactions={transactions}
                onInventoryUpdate={refreshData}
            />
          )}
          {view === 'schedule' && <DailySchedule equipment={equipment} onUpdate={refreshData} />}
          {view === 'inventory' && <InventoryManager equipment={equipment} onUpdate={refreshData} />}
          {view === 'stock' && <LubeStockManager inventory={inventory} transactions={transactions} onUpdate={refreshData} />}
          {view === 'sop' && <SOPManager />}
          {view === 'history' && <HistoryLog records={records} equipment={equipment} onUpdate={refreshData} />}
          {view === 'assistant' && <AiAssistant equipment={equipment} />}
        </div>
      </main>
    </div>
  );
};

export default App;
