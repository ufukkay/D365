import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, FolderSearch, Home, ChevronRight, Folder, Sun, Moon, Languages } from 'lucide-react';
import FileCard from './components/FileCard';
import DirectoryPicker from './components/DirectoryPicker';
import ContextMenu from './components/ContextMenu';
import ActionModal from './components/ActionModal';

const translations = {
  tr: {
    appTitle: 'Akıllı Dosya Yöneticisi',
    scanPlaceholder: 'Klasör Seçiniz...',
    scanButton: 'Tara',
    scanning: 'Taranıyor...',
    searchPlaceholder: 'Tüm dosyalarda ara...',
    searchResults: 'Arama Sonuçları',
    files: 'Dosyalar',
    overview: 'Son Tarananlar / Genel Bakış',
    folderEmpty: 'Klasör Boş',
    folderEmptyDesc: 'Bu klasörde içerik bulunamadı.',
    welcome: 'Hoşgeldiniz',
    welcomeDesc: 'Başlamak için yukarıdan bir klasör seçip taratın.',
    scanComplete: 'Tarama tamamlandı!',
    scanFailed: 'Tarama Başarısız: '
  },
  en: {
    appTitle: 'Smart File Manager',
    scanPlaceholder: 'Select Folder...',
    scanButton: 'Scan',
    scanning: 'Scanning...',
    searchPlaceholder: 'Search in all files...',
    searchResults: 'Search Results',
    files: 'Files',
    overview: 'Recent Scans / Overview',
    folderEmpty: 'Folder Empty',
    folderEmptyDesc: 'No content found in this folder.',
    welcome: 'Welcome',
    welcomeDesc: 'Select a folder above and scan to start.',
    scanComplete: 'Scan complete!',
    scanFailed: 'Scan Failed: '
  }
};

function App() {
  const [files, setFiles] = useState([]);
  const [shortcuts, setShortcuts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all'); // Filter state
  const [scanPath, setScanPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });

  // Modal Action State
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null, file: null, value: '' });

  // Fetch shortcuts & default path on mount
  useEffect(() => {
    // Shortcuts
    axios.get('http://localhost:3001/api/shortcuts')
      .then(res => setShortcuts(res.data))
      .catch(err => console.error("Shortcuts error:", err));

    // Default scan path (Desktop)
    axios.get('http://localhost:3001/api/default-path')
      .then(res => {
        if (!scanPath) setScanPath(res.data.path);
      })
      .catch(err => console.error("Default path error:", err));
  }, []);

  // Browsing state
  const [currentBrowsePath, setCurrentBrowsePath] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'tr');

  const t = translations[lang];

  // ... (Theme and Lang logic remains same)

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');

  const fetchFiles = async (query = '', parent = '', cat = category) => {
    setLoading(true);
    try {
      const url = `http://localhost:3001/api/files`;
      const params = {};
      if (query) params.query = query;
      if (parent && !query) params.parentPath = parent;
      if (cat && cat !== 'all') params.category = cat;

      const res = await axios.get(url, { params });
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    fetchFiles(search, currentBrowsePath, newCat);
  };

  const startScan = async (targetPath) => {
    if (!targetPath) return;
    setScanning(true);
    try {
      await axios.post('http://localhost:3001/api/scan', { path: targetPath });
      setCurrentBrowsePath(targetPath);
      fetchFiles('', targetPath, category);
    } catch (err) {
      console.error(err);
      alert(t.scanFailed + (err.response?.data?.error || err.message));
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val) {
      fetchFiles(val, '', category);
    } else {
      fetchFiles('', currentBrowsePath, category);
    }
  };

  // ... (handleFolderClick, handleBreadcrumbClick, getBreadcrumbs remains same) 
  const handleFolderClick = async (path) => {
    setSearch('');
    setCurrentBrowsePath(path);

    setScanning(true);
    try {
      await axios.post('http://localhost:3001/api/scan', { path });
    } catch (err) {
      console.error("Auto-scan failed:", err);
    } finally {
      setScanning(false);
      fetchFiles('', path, category);
    }
  };

  const handleBreadcrumbClick = (index, parts) => {
    const newPath = parts.slice(0, index + 1).join('\\');
    handleFolderClick(newPath || (parts[0] + '\\'));
  };

  const getBreadcrumbs = () => {
    if (!currentBrowsePath) return [];
    const normalized = currentBrowsePath.replace(/\//g, '\\');
    return normalized.split('\\').filter(Boolean).map((part, i, arr) => {
      return { name: part, path: arr.slice(0, i + 1).join('\\') };
    });
  };

  // Context Menu Logic
  useEffect(() => {
    const closeMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleContextMenu = (e, file = null) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      file,
    });
  };

  const handleMenuAction = (action, file) => {
    setContextMenu(prev => ({ ...prev, visible: false }));

    if (action === 'open') {
      if (file.type === 'directory') {
        handleFolderClick(file.path);
      } else {
        axios.post('http://localhost:3001/api/open', { path: file.path }).catch(console.error);
      }
      return;
    }

    let type = action; // 'new-folder', 'new-text', 'new-word', 'new-excel', 'new-ppt', 'rename', 'delete'
    let initialValue = '';

    if (action === 'rename') initialValue = file.name;
    // Set default names for new files
    else if (action === 'new-text') initialValue = 'Yeni Metin Belgesi.txt';
    else if (action === 'new-word') initialValue = 'Yeni Microsoft Word Belgesi.docx';
    else if (action === 'new-excel') initialValue = 'Yeni Microsoft Excel Çalışma Sayfası.xlsx';
    else if (action === 'new-ppt') initialValue = 'Yeni Microsoft PowerPoint Sunusu.pptx';

    setActionModal({
      isOpen: true,
      type,
      file,
      value: initialValue
    });
  };

  const handleModalConfirm = async (value) => {
    const { type, file } = actionModal;
    setActionModal(prev => ({ ...prev, isOpen: false })); // Close immediately

    try {
      if (type === 'new-folder') {
        await axios.post('http://localhost:3001/api/files/create', {
          parentPath: currentBrowsePath || scanPath,
          name: value,
          type: 'directory'
        });
      }
      else if (['new-file', 'new-text', 'new-word', 'new-excel', 'new-ppt'].includes(type)) {
        // For all file types, we use the generic 'file' type backend creation, 
        // but rely on the filename extension provided by the user/default value.
        await axios.post('http://localhost:3001/api/files/create', {
          parentPath: currentBrowsePath || scanPath,
          name: value,
          type: 'file'
        });
      }
      else if (type === 'rename') {
        await axios.post('http://localhost:3001/api/files/rename', {
          id: file.id,
          newName: value
        });
      }
      else if (type === 'delete') {
        await axios.delete(`http://localhost:3001/api/files/delete/${file.id}`);
      }

      fetchFiles('', currentBrowsePath, category);

    } catch (err) {
      console.error("Action error:", err);
      // alert("Hata: " + (err.response?.data?.error || err.message));
    }
  };

  const getModalProps = () => {
    const { type, file } = actionModal;
    switch (type) {
      case 'new-folder': return { title: 'Yeni Klasör Oluştur', message: 'Lütfen klasör adını giriniz:' };
      case 'new-file': return { title: 'Yeni Dosya Oluştur', message: 'Lütfen dosya adını (uzantısıyla) giriniz:' };
      case 'new-text': return { title: 'Yeni Metin Belgesi', message: 'Dosya adı:' };
      case 'new-word': return { title: 'Yeni Word Belgesi', message: 'Dosya adı:' };
      case 'new-excel': return { title: 'Yeni Excel Dosyası', message: 'Dosya adı:' };
      case 'new-ppt': return { title: 'Yeni PowerPoint Sunusu', message: 'Dosya adı:' };
      case 'rename': return { title: 'Yeniden Adlandır', message: 'Yeni ismi giriniz:' };
      case 'delete': return { title: 'Silme Onayı', message: `"${file?.name}" öğesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` };
      default: return {};
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200"
      onContextMenu={(e) => {
        // Only trigger background context menu if not clicking on a file (bubbling handled usually, but valid to check target)
        if (e.target === e.currentTarget || e.target.closest('main')) {
          handleContextMenu(e, null);
        }
      }}
    >
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentBrowsePath(''); fetchFiles(''); }}>
            <FolderSearch className="text-indigo-600 dark:text-indigo-400" size={28} />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 hidden sm:block">
              {t.appTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
              title="Switch Language"
            >
              <Languages size={18} />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-yellow-500 dark:text-blue-400"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Context Menu Render */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          onAction={handleMenuAction}
        />
      )}

      {/* Action Modal Render */}
      <ActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleModalConfirm}
        type={actionModal.type}
        initialValue={actionModal.value}
        {...getModalProps()}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Scan Button & Picker */}
          <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
            {/* ... (Scan button code, identical to original) ... */}
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              title={t.scanPlaceholder}
            >
              <FolderSearch size={24} />
            </button>
            <div className="relative flex-1 md:w-96">
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startScan(scanPath)}
                placeholder={t.scanPlaceholder}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
              <div className="absolute left-3 top-3.5 text-gray-400">
                <Folder size={20} />
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder={t.searchPlaceholder}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'documents', label: 'Belgeler' },
            { id: 'images', label: 'Resimler' },
            { id: 'videos', label: 'Videolar' },
            { id: 'audio', label: 'Ses' },
            { id: 'archives', label: 'Arşiv' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${category === cat.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Breadcrumbs */}
        {
          !search && currentBrowsePath && (
            <nav className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => { setCurrentBrowsePath(''); fetchFiles('', '', category); }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
              >
                <Home size={18} />
              </button>
              {getBreadcrumbs().map((crumb, i) => (
                <React.Fragment key={i}>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  <button
                    onClick={() => handleFolderClick(crumb.path)}
                    className="hover:text-indigo-600 hover:underline px-1 whitespace-nowrap font-medium"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          )
        }

        {/* Content Area */}
        {
          loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Shortcuts (Only shown when no folder is selected / Welcome state) */}
              {!currentBrowsePath && !search && shortcuts.length > 0 && category === 'all' && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Hızlı Erişim</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {shortcuts.map((sc, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setScanPath(sc.path); startScan(sc.path); }}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                      >
                        <div className="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-slate-600 transition-colors">
                          <Folder size={20} />
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{sc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  {search ? `${t.searchResults}: ${files.length}` : (currentBrowsePath ? t.files : t.overview)} {' '}
                  {category !== 'all' && <span className="text-sm font-normal text-gray-500">({category})</span>}
                </h2>
              </div>

              {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {files.map(file => (
                    <div
                      key={file.id}
                      onClick={() => file.type === 'directory' && handleFolderClick(file.path)}
                      onContextMenu={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, file);
                      }}
                    >
                      <FileCard file={file} lang={lang} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                  <FolderSearch size={48} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {currentBrowsePath ? t.folderEmpty : t.welcome}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {currentBrowsePath ? t.folderEmptyDesc : t.welcomeDesc}
                  </p>
                </div>
              )}
            </>
          )
        }

        {/* Modals */}
        {
          showPicker && (
            <DirectoryPicker
              onClose={() => setShowPicker(false)}
              onSelect={(path) => {
                setScanPath(path);
                startScan(path); // Auto-scan on select
                setShowPicker(false);
              }}
            />
          )
        }

      </main >
    </div >
  );
}

export default App;
