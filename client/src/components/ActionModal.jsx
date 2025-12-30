import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Trash2, Edit2, FolderPlus, FilePlus } from 'lucide-react';

export default function ActionModal({ type, initialValue = '', title, message, onConfirm, onClose, isOpen }) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setValue(initialValue);
            // Focus input if it exists
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(value);
    };

    const isDelete = type === 'delete';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100 border border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {type === 'new-folder' && <FolderPlus className="text-indigo-500" />}
                        {type === 'new-file' && <FilePlus className="text-indigo-500" />}
                        {type === 'rename' && <Edit2 className="text-blue-500" />}
                        {type === 'delete' && <Trash2 className="text-red-500" />}
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {message && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                            {message}
                        </p>
                    )}

                    {!isDelete && (
                        <div className="mb-6">
                            <input
                                ref={inputRef}
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400"
                                placeholder="İsim giriniz..."
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-md flex items-center gap-2
                ${isDelete
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                                }`}
                        >
                            {isDelete ? (
                                <>
                                    <Trash2 size={16} /> Sil
                                </>
                            ) : (
                                <>
                                    <Check size={16} /> Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
