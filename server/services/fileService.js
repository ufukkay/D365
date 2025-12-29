const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const db = require('../db');

// Prepared statements
// UPSERT logic: Insert new file, or update stats if exists, BUT PRESERVE tags/importance
const insertFile = db.prepare(`
    INSERT INTO files (id, path, name, type, size, mtime, birthtime, owner, permissions, parent_path, summary, tags, importance, last_scanned)
    VALUES (@id, @path, @name, @type, @size, @mtime, @birthtime, @owner, @permissions, @parent_path, @summary, '', 'normal', CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
        size = excluded.size,
        mtime = excluded.mtime,
        birthtime = excluded.birthtime,
        last_scanned = CURRENT_TIMESTAMP
        /* tags and importance are NOT updated here, effectively preserving them */
`);

const scanDirectory = async (dirPath) => {
    let stats = { files: 0, directories: 0, errors: 0 };

    if (dirPath.match(/^[a-zA-Z]:$/)) {
        dirPath = dirPath + path.sep;
    }
    dirPath = path.resolve(dirPath);

    try {
        await fs.access(dirPath);
    } catch {
        throw new Error(`Directory not found: ${dirPath}`);
    }

    // SCOPED CLEANUP: Only remove files that are NOT in the current scan list?
    // Actually, 'DELETE FROM files' wipes the folder in DB. 
    // If we want to preserve tags for files that still exist, we shouldn't blind delete.
    // OPTIMIZATION: Instead of delete, we might need to rely on UPSERT.
    // BUT, what if a file was deleted in OS? We need to remove it from DB.
    // Strategy: 
    // 1. Get list of all IDs currently in DB for this folder.
    // 2. Scan and Upsert all current files. Track their IDs.
    // 3. Delete IDs from Step 1 that were NOT in Step 2.

    // For now, to keep it simple and safe for "Tags", we will NOT delete everything first.
    // We will scan and upsert. 
    // Stale files (deleted from OS) might remain in DB with this approach until we handle cleanup.
    // Let's implement the cleaner approach: "Soft Delete" or "Mark Scanned".
    // 1. Update all files in this parent_path set last_scanned = 0
    // 2. Scan & Upsert (sets last_scanned = NOW)
    // 3. Delete files in metadata where parent_path = dirPath AND last_scanned != NOW

    // Let's stick to the current "delete all" BUT that wipes tags.
    // Changing strategy to "Mark & Sweep" for data preservation.

    const markStmt = db.prepare("UPDATE files SET last_scanned = 0 WHERE parent_path = ?");
    markStmt.run(dirPath);

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        const scanTime = new Date().toISOString();

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const id = crypto.createHash('md5').update(fullPath).digest('hex');
            const type = entry.isDirectory() ? 'directory' : 'file';
            let size = 0;
            let mtime = null;
            let birthtime = null;

            if (type === 'file' || type === 'directory') {
                try {
                    const fileStat = await fs.stat(fullPath);
                    size = fileStat.size;
                    mtime = fileStat.mtime.toISOString();
                    birthtime = fileStat.birthtime.toISOString();
                } catch { }

                if (type === 'file') stats.files++;
                else stats.directories++;
            }

            insertFile.run({
                id,
                path: fullPath,
                name: entry.name,
                type,
                size,
                mtime,
                birthtime,
                owner: 'System',
                permissions: '',
                parent_path: dirPath,
                summary: ''
            });
        }

        // Sweep (Delete stale files)
        // We delete files in this folder that weren't just updated (last_scanned is still 0 or old)
        // Since insertFile updates last_scanned to CURRENT_TIMESTAMP, 
        // we can delete anything with old timestamp.
        // NOTE: SQLite CURRENT_TIMESTAMP is UTC. Our scanned logic needs to align.
        // Actually, just delete where last_scanned = 0.
        db.prepare("DELETE FROM files WHERE parent_path = ? AND last_scanned = 0").run(dirPath);

    } catch (err) {
        console.error(`Error scanning ${dirPath}:`, err);
        stats.errors++;
        throw err;
    }

    return stats;
};

const getFiles = ({ query, parentPath }) => {
    let stmt;
    if (query) {
        // Global search
        stmt = db.prepare('SELECT * FROM files WHERE name LIKE ? OR tags LIKE ? ORDER BY importance DESC, type ASC, mtime DESC LIMIT 1000');
        return stmt.all(`%${query}%`, `%${query}%`);
    } else if (parentPath) {
        // Hierarchy view
        let searchPath = parentPath;
        if (searchPath.match(/^[a-zA-Z]:$/)) searchPath += path.sep;

        // Sort by folder first, then importance (high to low), then name
        // importance enum isn't native, so we might need case or just string sort
        // Let's rely on simple sort for now or map 'high' > 'medium'.
        // For simplicity: alphabetical for now, or maybe importance first?
        // User asked for "Importance", usually implies sorting.
        // Let's try to map importance to integer for sorting if easy, else just string (high, medium, low) -> 'critical', 'high', 'medium', 'low' ?
        // or just let frontend sort.
        // Let's push raw data.
        stmt = db.prepare('SELECT * FROM files WHERE parent_path = ? ORDER BY type ASC, name ASC');
        return stmt.all(searchPath);
    } else {
        return [];
    }
};

const getFileDetails = (id) => {
    return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
};

const updateFileMetadata = (id, { tags, importance }) => {
    const stmt = db.prepare('UPDATE files SET tags = @tags, importance = @importance WHERE id = @id');
    const res = stmt.run({ id, tags, importance });
    return res.changes > 0;
};

// System Directory Browsing
const browseSystem = async (browsePath) => {
    if (!browsePath) {
        if (os.platform() === 'win32') {
            const drives = [];
            for (let i = 67; i <= 90; i++) {
                const drive = String.fromCharCode(i) + ':';
                try {
                    await fs.access(drive + '\\');
                    drives.push({ name: drive, path: drive + '\\', type: 'drive' });
                } catch { }
            }
            return drives;
        } else {
            return [{ name: '/', path: '/', type: 'directory' }];
        }
    }

    try {
        const entries = await fs.readdir(browsePath, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory())
            .map(e => ({
                name: e.name,
                path: path.join(browsePath, e.name),
                type: 'directory'
            }));
    } catch (err) {
        throw new Error('Access denied or invalid path');
    }
};

module.exports = {
    scanDirectory,
    getFiles,
    getFileDetails,
    updateFileMetadata,
    browseSystem
};
