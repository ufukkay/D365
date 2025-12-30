const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fileService = require('./services/fileService');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Endpoints

// Scan a directory
app.post('/api/scan', async (req, res) => {
    const { path: dirPath } = req.body;
    try {
        const result = await fileService.scanDirectory(dirPath);
        res.json({ success: true, message: 'Scan started/completed', stats: result });
    } catch (error) {
        console.error('Scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List system files for picker
app.get('/api/browse', async (req, res) => {
    const { path } = req.query;
    try {
        const items = await fileService.browseSystem(path);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Open file in OS
app.post('/api/open', async (req, res) => {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: 'Path is required' });

    // Sanitize/Quote path for safety (basic)
    const command = process.platform === 'win32' ? `start "" "${filePath}"` : `xdg-open "${filePath}"`;

    exec(command, (error) => {
        if (error) {
            console.error(`Exec error: ${error}`);
        }
    });

    res.json({ success: true, message: 'Opening...' });
});

// List files (flattened search or tree)
app.get('/api/files', (req, res) => {
    const { query, parentPath, category } = req.query;
    try {
        const files = fileService.getFiles({ query, parentPath, category });
        res.json(files);
    } catch (error) {
        console.error('List error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get file content/details
app.get('/api/file/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const file = fileService.getFileDetails(id);
        if (!file) return res.status(404).json({ error: 'File not found' });
        res.json(file);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update File Metadata (Tags, Importance)
app.patch('/api/file/:id/metadata', (req, res) => {
    const { tags, importance } = req.body;
    try {
        const success = fileService.updateFileMetadata(req.params.id, { tags, importance });
        if (success) res.json({ success: true });
        else res.status(404).json({ error: 'File not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create File/Folder
app.post('/api/files/create', async (req, res) => {
    const { parentPath, name, type } = req.body;
    try {
        await fileService.createItem(parentPath, name, type);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rename File/Folder
app.post('/api/files/rename', async (req, res) => {
    const { id, newName } = req.body;
    try {
        await fileService.renameItem(id, newName);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete File/Folder
app.delete('/api/files/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await fileService.deleteItem(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dynamic Default Path Endpoint
app.get('/api/default-path', (req, res) => {
    try {
        const desktopPath = path.join(os.homedir(), 'Desktop');
        res.json({ path: desktopPath });
    } catch (error) {
        res.status(500).json({ error: 'Could not resolve desktop path' });
    }
});

// Common Shortcuts Endpoint
app.get('/api/shortcuts', (req, res) => {
    try {
        const home = os.homedir();
        const shortcuts = [
            { name: 'Desktop', path: path.join(home, 'Desktop') },
            { name: 'Documents', path: path.join(home, 'Documents') },
            { name: 'Downloads', path: path.join(home, 'Downloads') },
            { name: 'Pictures', path: path.join(home, 'Pictures') },
            { name: 'Music', path: path.join(home, 'Music') },
            { name: 'Videos', path: path.join(home, 'Videos') }
        ];
        res.json(shortcuts);
    } catch (error) {
        res.status(500).json({ error: 'Could not resolve shortcuts' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`\n--- SMART FILE MANAGER READY ---`);
});
