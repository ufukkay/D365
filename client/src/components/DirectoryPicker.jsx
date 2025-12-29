import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, HardDrive, Check, X, ChevronRight } from 'lucide-react';

const DirectoryPicker = ({ onSelect, onClose }) => {
    const [path, setPath] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchItems = async (browsePath) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:3001/api/browse?path=${encodeURIComponent(browsePath || '')}`);
            setItems(res.data);
            setPath(browsePath || '');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems('');
    }, []);

    const handleNavigate = (newPath) => {
        fetchItems(newPath);
    };

    const handleUp = () => {
        if (!path) return;
        // Simple string manipulation for parent
        const parts = path.split(/[\/\\]/);
        parts.pop();
        // If empty after pop, it might be root drive letter e.g. "C:" -> "" (which lists drives) or "C:\foo" -> "C:"
        const parent = parts.join('\\');
        // If parent becomes "C:", add slash if needed or handled by backend? 
        // Backend handles "C:" likely as specific folder? BrowserSystem implementation logic check:
        // C: without backslash usually current dir of process. 
        // Let's rely on backend returning drives if empty string.
        // If path was "C:\", split might give ["C:", ""]. Pop -> ["C:"]. 

        // Improve: use backend parent logic or just proper slice
        // Quick fix for Windows paths:
        if (path.endsWith(':\\')) {
            // Already root of drive, go to drives list
            fetchItems('');
            return;
        }

        fetchItems(parent || '');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-slate-700">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold dark:text-white">Klasör Seç</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex gap-2">
                    <button onClick={handleUp} disabled={!path} className="px-3 py-1 bg-white dark:bg-slate-800 border rounded shadow-sm disabled:opacity-50 text-sm">
                        Yukarı
                    </button>
                    <input
                        type="text"
                        value={path}
                        readOnly
                        className="flex-1 px-3 py-1 text-sm bg-white dark:bg-slate-800 border rounded dark:text-gray-300 font-mono"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleNavigate(item.path)}
                                    className="flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer group transition-colors"
                                >
                                    {item.type === 'drive' ? <HardDrive size={20} className="text-gray-500" /> : <Folder size={20} className="text-yellow-500" />}
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                                    <ChevronRight size={16} className="ml-auto text-gray-300 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))}
                            {items.length === 0 && <div className="text-center p-4 text-gray-400">Boş veya erişilemiyor.</div>}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">İptal</button>
                    <button
                        onClick={() => onSelect(path)}
                        disabled={!path}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Check size={18} />
                        Bu Klasörü Tara
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DirectoryPicker;
