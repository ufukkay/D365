import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, RefreshCw, FolderSearch, Home, ChevronRight, Folder, Sun, Moon, Languages } from 'lucide-react';
import FileCard from './components/FileCard';
import DirectoryPicker from './components/DirectoryPicker';

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
  const [shortcuts, setShortcuts] = useState([]); // New state for shortcuts
  const [search, setSearch] = useState('');
  const [scanPath, setScanPath] = useState(''); // Init empty, fetch dynamic
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Fetch Default Desktop Path & Shortcuts on Mount
  useEffect(() => {
    axios.get('http://localhost:3001/api/default-path')
      .then(res => setScanPath(res.data.path))
      .catch(err => console.error("Failed to get default path:", err));

    axios.get('http://localhost:3001/api/shortcuts')
      .then(res => setShortcuts(res.data))
      .catch(err => console.error("Failed to get shortcuts:", err));
  }, []);

  // Browsing state
  const [currentBrowsePath, setCurrentBrowsePath] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'tr');

  const t = translations[lang];

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language persistence
  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(lang === 'tr' ? 'en' : 'tr');

  const fetchFiles = async (query = '', parent = '') => {
    setLoading(true);
    try {
      const url = `http://localhost:3001/api/files`;
      const params = {};
      if (query) params.query = query;
      if (parent && !query) params.parentPath = parent;

      const res = await axios.get(url, { params });
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startScan = async (targetPath) => {
    if (!targetPath) return;
    setScanning(true);
    try {
      await axios.post('http://localhost:3001/api/scan', { path: targetPath });
      // Removed alert('Scan complete!') as requested
      setCurrentBrowsePath(targetPath);
      fetchFiles('', targetPath);
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
      fetchFiles(val);
    } else {
      fetchFiles('', currentBrowsePath);
    }
  };

  // Auto-scan and navigate
  const handleFolderClick = async (path) => {
    setSearch('');
    setCurrentBrowsePath(path);
    // Optimistic: Fetch what we have (might be empty/stale)
    // fetchFiles('', path); 

    // Trigger Scan (Lazy Load)
    setScanning(true);
    try {
      await axios.post('http://localhost:3001/api/scan', { path });
    } catch (err) {
      console.error("Auto-scan failed (likely permission or empty):", err);
    } finally {
      setScanning(false);
      // Fetch fresh results
      fetchFiles('', path);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Scan Button & Picker */}
          <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
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
          <div className="relative flex-1 group">
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

        {/* Breadcrumbs (Moved up slightly) */}

        {/* Breadcrumbs */}
        {!search && currentBrowsePath && (
          <nav className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => { setCurrentBrowsePath(''); fetchFiles(''); }}
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
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Shortcuts (Only shown when no folder is selected / Welcome state) */}
            {!currentBrowsePath && !search && shortcuts.length > 0 && (
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
                {search ? `${t.searchResults}: ${files.length}` : (currentBrowsePath ? t.files : t.overview)}
              </h2>
            </div>

            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map(file => (
                  <div key={file.id} onClick={() => file.type === 'directory' && handleFolderClick(file.path)}>
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
        )}

        {/* Modals */}
        {showPicker && (
          <DirectoryPicker
            onClose={() => setShowPicker(false)}
            onSelect={(path) => {
              setScanPath(path);
              startScan(path); // Auto-scan on select
              setShowPicker(false);
            }}
          />
        )}

      </main>
    </div>
  );
}

export default App;
