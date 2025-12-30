import React, { useEffect, useRef, useState } from 'react';
import {
    FolderPlus, FilePlus, Edit2, Trash2, ExternalLink,
    ChevronRight, FileText, FileSpreadsheet, Presentation, AlignLeft
} from 'lucide-react';

const ContextMenu = ({ x, y, onClose, onAction, file }) => {
    const menuRef = useRef(null);
    const [showNewSubmenu, setShowNewSubmenu] = useState(false);

    // Close when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, [onClose]);

    // Submenu items
    const newItems = [
        { label: 'Klasör', icon: <FolderPlus size={16} className="text-yellow-500" />, action: 'new-folder' },
        { label: 'Metin Belgesi', icon: <AlignLeft size={16} className="text-gray-500" />, action: 'new-text' },
        { label: 'Word Belgesi', icon: <FileText size={16} className="text-blue-600" />, action: 'new-word' },
        { label: 'Excel Çalışma Sayfası', icon: <FileSpreadsheet size={16} className="text-green-600" />, action: 'new-excel' },
        { label: 'PowerPoint Sunusu', icon: <Presentation size={16} className="text-orange-500" />, action: 'new-ppt' },
    ];

    if (!file) {
        // Canvas (Empty space) context menu
        return (
            <div
                ref={menuRef}
                className="absolute z-50 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 text-sm text-gray-700 dark:text-gray-200"
                style={{ top: y, left: x }}
            >
                {/* New Submenu Trigger */}
                <div
                    className="relative"
                    onMouseEnter={() => setShowNewSubmenu(true)}
                    onMouseLeave={() => setShowNewSubmenu(false)}
                >
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center">
                                <span className="text-[10px] text-gray-500 leading-none">+</span>
                            </div>
                            <span>Yeni</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-gray-600" />
                    </button>

                    {/* Submenu */}
                    {showNewSubmenu && (
                        <div className="absolute left-full top-0 w-60 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 -ml-1">
                            {newItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAction(item.action);
                                        onClose();
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

                <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-gray-400 cursor-not-allowed"
                    disabled
                >
                    <ExternalLink size={16} />
                    <span>Terminalde Aç</span>
                </button>
            </div>
        );
    }

    // File Context Menu
    return (
        <div
            ref={menuRef}
            className="absolute z-50 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 text-sm text-gray-700 dark:text-gray-200"
            style={{ top: y, left: x }}
        >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 font-medium truncate text-xs text-gray-400 flex items-center gap-2">
                {file.type === 'directory' ? <FolderPlus size={12} /> : <FileText size={12} />}
                {file.name}
            </div>

            <button
                onClick={() => onAction('open', file)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
                <ExternalLink size={16} />
                <span>Aç</span>
            </button>

            <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

            <button
                onClick={() => onAction('rename', file)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
                <Edit2 size={16} className="text-blue-500" />
                <span>Yeniden Adlandır</span>
            </button>

            <button
                onClick={() => onAction('delete', file)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
                <Trash2 size={16} />
                <span>Sil</span>
            </button>
        </div>
    );
};

export default ContextMenu;
