import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const PreviewModal = ({ file, onClose }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [type, setType] = useState('unknown');

    const serverUrl = 'http://localhost:3001';
    const streamUrl = `${serverUrl}/api/stream?path=${encodeURIComponent(file.path)}`;

    useEffect(() => {
        const ext = file.name.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
            setType('image');
            setLoading(false);
        } else if (['mp4', 'webm', 'ogg'].includes(ext)) {
            setType('video');
            setLoading(false);
        } else if (['mp3', 'wav', 'm4a'].includes(ext)) {
            setType('audio');
            setLoading(false);
        } else if (['pdf'].includes(ext)) {
            setType('pdf');
            setLoading(false);
        } else if (['txt', 'md', 'json', 'js', 'css', 'html', 'xml', 'log'].includes(ext)) {
            setType('text');
            fetchText();
        } else if (['docx'].includes(ext)) {
            setType('docx');
            fetchDocx();
        } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
            setType('xlsx');
            fetchXlsx();
        } else {
            setType('unsupported');
            setLoading(false);
        }
    }, [file]);

    const fetchText = async () => {
        try {
            const res = await axios.get(streamUrl, { responseType: 'text' });
            setContent(res.data);
            setLoading(false);
        } catch (err) {
            setError('Metin dosyası okunamadı.');
            setLoading(false);
        }
    };

    const fetchDocx = async () => {
        try {
            const res = await axios.get(streamUrl, { responseType: 'arraybuffer' });
            const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
            setContent(result.value);
            setLoading(false);
        } catch (err) {
            setError('Word belgesi okunamadı.');
            setLoading(false);
        }
    };

    const fetchXlsx = async () => {
        try {
            const res = await axios.get(streamUrl, { responseType: 'arraybuffer' });
            const workbook = XLSX.read(res.data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(sheet);
            setContent(html);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Excel dosyası okunamadı.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={20} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate" title={file.name}>{file.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={streamUrl}
                            download={file.name}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="İndir"
                        >
                            <Download size={20} />
                        </a>
                        <button onClick={onClose} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-950 flex justify-center items-center relative">
                    {loading && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            <span className="text-gray-500 font-medium">Yükleniyor...</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center gap-2 text-red-500">
                            <AlertCircle size={40} />
                            <span className="font-semibold">{error}</span>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {type === 'image' && (
                                <img src={streamUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                            )}

                            {type === 'video' && (
                                <video controls autoPlay className="max-w-full max-h-full rounded-lg shadow-lg bg-black">
                                    <source src={streamUrl} />
                                    Tarayıcınız bu videoyu desteklemiyor.
                                </video>
                            )}

                            {type === 'audio' && (
                                <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
                                    <audio controls autoPlay className="w-96">
                                        <source src={streamUrl} />
                                    </audio>
                                </div>
                            )}

                            {type === 'pdf' && (
                                <iframe src={streamUrl} className="w-full h-full border-0" title="PDF Preview"></iframe>
                            )}

                            {type === 'text' && (
                                <div className="w-full h-full p-6 text-sm font-mono overflow-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                    {content}
                                </div>
                            )}

                            {type === 'docx' && (
                                <div className="w-full h-full p-8 overflow-auto bg-white text-black prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                            )}

                            {type === 'xlsx' && (
                                <div className="w-full h-full p-4 overflow-auto bg-white dark:bg-slate-900">
                                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
                                    {/* Simple styling for table */}
                                    <style>{`
                                       table { border-collapse: collapse; width: 100%; }
                                       td, th { border: 1px solid #ddd; padding: 8px; }
                                       th { padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #f2f2f2; }
                                       .dark th { background-color: #334155; border-color: #475569; }
                                       .dark td { border-color: #475569; }
                                   `}</style>
                                </div>
                            )}

                            {type === 'unsupported' && (
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Önizleme Kullanılamıyor</p>
                                    <p className="text-sm mt-2">Bu dosya türü için önizleme desteklenmiyor.</p>
                                    <a href={streamUrl} download className="mt-4 inline-block text-indigo-600 hover:underline">Dosyayı İndir</a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;
