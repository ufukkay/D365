const fileService = require('./services/fileService');
const db = require('./db');

async function test() {
    console.log("Starting debug scan...");
    try {
        const path = 'c:\\Users\\Ufuk\\Desktop\\D365\\client\\src';
        const stats = await fileService.scanDirectory(path);
        console.log("Scan Result:", stats);

        const count = db.prepare('SELECT COUNT(*) as c FROM files').get().c;
        console.log("DB Count:", count);

        if (count > 0) {
            const row = db.prepare('SELECT * FROM files LIMIT 1').get();
            console.log("Sample Row:", row);
        }
    } catch (err) {
        console.error("Scan Failed:", err);
    }
}

test();
