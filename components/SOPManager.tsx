
import React, { useState, useEffect } from 'react';
import { SOPCategory, SOPDocument } from '../types';
import { getSOPCategories, saveSOPCategories, getSOPDocuments, saveSOPDocuments } from '../services/storageService';
import { Plus, Edit2, Trash2, BookOpen, FolderOpen, Save, X, FileText, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const SOPManager: React.FC = () => {
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SOPCategory | null>(null);
  
  // Modal states
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<SOPCategory>>({});
  const [editingDoc, setEditingDoc] = useState<Partial<SOPDocument>>({});

  useEffect(() => {
    setCategories(getSOPCategories());
    setDocuments(getSOPDocuments());
  }, []);

  const refreshData = () => {
      setCategories(getSOPCategories());
      setDocuments(getSOPDocuments());
  }

  // --- Category Handlers ---
  const handleSaveCategory = () => {
    if (!editingCategory.name) return;
    let newCats = [...categories];
    if (editingCategory.id) {
        newCats = newCats.map(c => c.id === editingCategory.id ? { ...c, ...editingCategory } as SOPCategory : c);
    } else {
        newCats.push({ ...editingCategory, id: crypto.randomUUID() } as SOPCategory);
    }
    saveSOPCategories(newCats);
    setCategories(newCats);
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除此分类吗？分类下的文档也会被隐藏。')) {
        const newCats = categories.filter(c => c.id !== id);
        saveSOPCategories(newCats);
        setCategories(newCats);
        if (selectedCategory?.id === id) setSelectedCategory(null);
    }
  };

  const openCategoryModal = (cat?: SOPCategory) => {
      setEditingCategory(cat || { name: '', description: '' });
      setIsCatModalOpen(true);
  };

  // --- Document Handlers ---
  const handleSaveDoc = () => {
    if (!editingDoc.title || !selectedCategory) return;
    let newDocs = [...documents];
    const now = new Date().toISOString().split('T')[0];
    
    if (editingDoc.id) {
        newDocs = newDocs.map(d => d.id === editingDoc.id ? { ...d, ...editingDoc, updatedAt: now } as SOPDocument : d);
    } else {
        newDocs.push({ 
            ...editingDoc, 
            id: crypto.randomUUID(), 
            categoryId: selectedCategory.id, 
            updatedAt: now 
        } as SOPDocument);
    }
    saveSOPDocuments(newDocs);
    setDocuments(newDocs);
    setIsDocModalOpen(false);
  };

  const handleDeleteDoc = (id: string) => {
      if (confirm('确定删除此文档吗？')) {
          const newDocs = documents.filter(d => d.id !== id);
          saveSOPDocuments(newDocs);
          setDocuments(newDocs);
      }
  };

  const openDocModal = (doc?: SOPDocument) => {
      setEditingDoc(doc || { title: '', content: '' });
      setIsDocModalOpen(true);
  };

  const filteredDocs = documents.filter(d => d.categoryId === selectedCategory?.id);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 animate-fade-in">
      
      {/* Left Sidebar: Categories */}
      <div className="md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FolderOpen size={20} className="text-blue-600" />
                设备/作业分类
            </h3>
            <button 
                onClick={() => openCategoryModal()}
                className="p-1.5 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                title="添加新分类"
            >
                <Plus size={18} />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {categories.map(cat => (
                <div 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group transition-all ${
                        selectedCategory?.id === cat.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                >
                    <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        {cat.description && <div className="text-xs text-slate-400 truncate">{cat.description}</div>}
                    </div>
                    {selectedCategory?.id === cat.id && (
                        <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); openCategoryModal(cat); }} className="p-1 hover:bg-blue-200 rounded text-blue-600"><Edit2 size={14} /></button>
                            <button onClick={(e) => handleDeleteCategory(cat.id, e)} className="p-1 hover:bg-red-200 rounded text-red-500"><Trash2 size={14} /></button>
                        </div>
                    )}
                    {selectedCategory?.id !== cat.id && <ChevronRight size={16} className="text-slate-300" />}
                </div>
            ))}
            {categories.length === 0 && (
                <div className="text-center p-8 text-slate-400 text-sm">
                    暂无分类，请点击右上角添加。
                </div>
            )}
        </div>
      </div>

      {/* Right Content: Documents */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {selectedCategory ? (
            <>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedCategory.name}</h2>
                        <p className="text-xs text-slate-500">标准作业指导书 (SOP) 列表</p>
                    </div>
                    <button 
                        onClick={() => openDocModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        新增 SOP 文档
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    <div className="grid grid-cols-1 gap-4">
                        {filteredDocs.map(doc => (
                            <div key={doc.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{doc.title}</h3>
                                            <p className="text-xs text-slate-400 mt-1">更新于: {doc.updatedAt}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => openDocModal(doc)}
                                            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded transition-colors flex items-center gap-1"
                                        >
                                            <Edit2 size={14} /> 编辑
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteDoc(doc.id)}
                                            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors flex items-center gap-1"
                                        >
                                            <Trash2 size={14} /> 删除
                                        </button>
                                    </div>
                                </div>
                                <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <ReactMarkdown>{doc.content}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {filteredDocs.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                                <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-500 font-medium">该分类下暂无 SOP 文档</p>
                                <button onClick={() => openDocModal()} className="mt-2 text-blue-600 hover:underline text-sm">
                                    立即创建第一个文档
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <FolderOpen size={64} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">请从左侧选择一个设备分类</p>
                <p className="text-sm">查看或管理该分类下的作业标准</p>
            </div>
        )}
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{editingCategory.id ? '编辑分类' : '新增分类'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">分类名称</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingCategory.name}
                            onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                            placeholder="例如: 空压机系统"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">描述 (可选)</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={editingCategory.description}
                            onChange={e => setEditingCategory({...editingCategory, description: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsCatModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded border">取消</button>
                        <button onClick={handleSaveCategory} className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">保存</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{editingDoc.id ? '编辑 SOP 文档' : '新增 SOP 文档'}</h3>
                    <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">文档标题</label>
                        <input 
                            type="text" 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                            value={editingDoc.title}
                            onChange={e => setEditingDoc({...editingDoc, title: e.target.value})}
                            placeholder="例如: 螺杆空压机月度润滑保养流程"
                        />
                    </div>
                    <div className="h-full flex flex-col">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            内容 (支持 Markdown)
                        </label>
                        <textarea 
                            className="w-full flex-1 border p-4 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed min-h-[300px]"
                            value={editingDoc.content}
                            onChange={e => setEditingDoc({...editingDoc, content: e.target.value})}
                            placeholder="# 操作步骤&#10;1. 第一步...&#10;2. 第二步..."
                        ></textarea>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button onClick={() => setIsDocModalOpen(false)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded border bg-white">取消</button>
                    <button onClick={handleSaveDoc} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                        <Save size={18} /> 保存文档
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SOPManager;
