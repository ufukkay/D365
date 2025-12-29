import React, { useState } from 'react';
import { FileText, Folder, FileQuestion, ChevronDown, ChevronUp, ExternalLink, FileCode, FileImage, FileVideo, Tag, Star, Save } from 'lucide-react';
import axios from 'axios';

const FileCard = ({ file, lang = 'tr' }) => {
    const [expanded, setExpanded] = useState(false);

    // Metadata state
    const [tags, setTags] = useState(file.tags || '');
    const [importance, setImportance] = useState(file.importance || 'normal');
    const [isDirty, setIsDirty] = useState(false);

    const getExtension = (name) => {
        return name.includes('.') ? name.split('.').pop().toUpperCase() : 'DIR';
    };

    const ext = file.type === 'directory' ? 'DIR' : getExtension(file.name);

    const getIcon = () => {
        if (file.type === 'directory') return <Folder className="text-yellow-400" size={24} />;

        switch (ext.toLowerCase()) {
            case 'js':
            case 'jsx':
            case 'ts':
            case 'tsx':
            case 'json':
            case 'html':
            case 'css':
                return <FileCode className="text-blue-500" size={24} />;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
            case 'gif':
                return <FileImage className="text-purple-500" size={24} />;
            case 'mp4':
            case 'mkv':
            case 'avi':
                return <FileVideo className="text-red-500" size={24} />;
            default:
                return <FileText className="text-gray-400" size={24} />;
        }
    };

    const formatSize = (bytes) => {
        if (!bytes && bytes !== 0) return '-';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
    };

    const handleOpen = async (e) => {
        e.stopPropagation();
        try {
            await axios.post('http://localhost:3001/api/open', { path: file.path });
        } catch (err) {
            console.error('Failed to open:', err);
        }
    };

    const handleSaveMetadata = async (e) => {
        e.stopPropagation();
        try {
            // PROCESSED: Normalize tags (split by , or # or space, trim, unique)
            const processedTags = tags
                .split(/[,#]+/)
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .join(',');

            await axios.patch(`http://localhost:3001/api/file/${file.id}/metadata`, { tags: processedTags, importance });
            setTags(processedTags); // Update local state with clean version
            setIsDirty(false);
        } catch (err) {
            console.error("Failed to save metadata", err);
            alert("Error saving metadata");
        }
    };

    const labels = {
        tr: {
            hidden: 'Gizle',
            show: 'Özet ve Etiketler',
            mod: 'Düzenlenme',
            create: 'Oluşturulma',
            size: 'Boyut',
            open: 'Sistemde Aç',
            empty: 'İçerik özeti yok.',
            owner: 'Sahip',
            importance: 'Önem',
            tags: 'Etiketler (virgül veya # ile ayırın)',
            save: 'Kaydet'
        },
        en: {
            hidden: 'Hide',
            show: 'Details & Tags',
            mod: 'Modified',
            create: 'Created',
            size: 'Size',
            open: 'Open System',
            empty: 'No content summary.',
            owner: 'Owner',
            importance: 'Importance',
            tags: 'Tags (separate by , or #)',
            save: 'Save'
        }
    };
    const t = labels[lang] || labels.tr;

    // Importance Styling
    const impColor = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-green-100 text-green-700 border-green-200',
        normal: 'bg-gray-50 text-gray-500 border-gray-200'
    };

    // Helper to safely split tags for display
    const getDisplayTags = (tagStr) => {
        if (!tagStr) return [];
        return tagStr.split(/[,#]+/).map(t => t.trim()).filter(Boolean);
    };

    return (
        <div className={`group bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-all p-4 border relative overflow-hidden ${importance !== 'normal' ? 'border-l-4 ' + impColor[importance].replace('bg-', 'border-l-') : 'border-gray-200 dark:border-slate-700'
            }`}>
            <div className="flex items-start justify-between">
                {/* Left Side: Icon + Name + Path */}
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        {getIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate flex items-center gap-2" title={file.name}>
                            {file.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={file.path}>
                            {file.path}
                        </p>
                    </div>
                </div>

                {/* Right Side: Type & Actions (Simplified) */}
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${file.type === 'directory'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {ext}
                    </span>

                    <button
                        onClick={handleOpen}
                        title={t.open}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    >
                        <ExternalLink size={16} />
                    </button>
                </div>
            </div>

            <div className="mt-3">
                {/* Metadata line for collapsed view */}
                {!expanded && (
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-2 h-6">
                        {/* Left: Size & Date */}
                        <div className="flex gap-3">
                            <span>{file.type === 'directory' ? '-' : formatSize(file.size)}</span>
                            <span className="border-l pl-3 border-gray-200 dark:border-gray-700">{formatDate(file.mtime).split(' ')[0]}</span>
                        </div>

                        {/* Right: Tags & Importance */}
                        <div className="flex items-center gap-2">
                            {tags && (
                                <div className="flex gap-1 max-w-[150px] overflow-hidden justify-end">
                                    {getDisplayTags(tags).slice(0, 2).map((tag, i) => (
                                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[70px]">
                                            #{tag}
                                        </span>
                                    ))}
                                    {getDisplayTags(tags).length > 2 && <span className="text-[10px] text-gray-400 font-bold">...</span>}
                                </div>
                            )}

                            {importance !== 'normal' && (
                                <div className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${impColor[importance]}`}>
                                    {importance}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="text-xs flex items-center text-blue-500 hover:text-blue-600 font-medium transition-colors w-full justify-center py-1 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded"
                >
                    {expanded ? (
                        <>
                            <ChevronUp size={14} className="mr-1" /> {t.hidden}
                        </>
                    ) : (
                        <>
                            <ChevronDown size={14} className="mr-1" /> {t.show}
                        </>
                    )}
                </button>

                {expanded && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-md text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default" onClick={(e) => e.stopPropagation()}>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-3 text-xs border-b border-gray-200 dark:border-slate-700 pb-2">
                            <div>
                                <span className="font-semibold block text-gray-500 dark:text-gray-400">{t.create}:</span>
                                {formatDate(file.birthtime)}
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-500 dark:text-gray-400">{t.mod}:</span>
                                {formatDate(file.mtime)}
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-500 dark:text-gray-400">{t.size}:</span>
                                {file.type === 'directory' ? '-' : formatSize(file.size)}
                            </div>
                            <div>
                                <span className="font-semibold block text-gray-500 dark:text-gray-400">{t.owner}:</span>
                                {file.owner || 'System'}
                            </div>
                        </div>

                        {/* Interactive Metadata Edit Section */}
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <Star size={12} /> {t.importance}
                                </label>
                                <select
                                    value={importance}
                                    onChange={(e) => { setImportance(e.target.value); setIsDirty(true); }}
                                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="low">Low (Düşük)</option>
                                    <option value="medium">Medium (Orta)</option>
                                    <option value="high">High (Yüksek)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <Tag size={12} /> {t.tags}
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    placeholder={t.tags}
                                    onChange={(e) => { setTags(e.target.value); setIsDirty(true); }}
                                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                />
                            </div>

                            {isDirty && (
                                <button
                                    onClick={handleSaveMetadata}
                                    className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors animate-pulse"
                                >
                                    <Save size={12} /> {t.save}
                                </button>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default FileCard;
