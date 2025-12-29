const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';
// Use the client src folder as a safe, existing target for testing
const TARGET_DIR = path.resolve('c:/Users/Ufuk/Desktop/D365/client/src');

const log = (step, msg, success = true) => {
    console.log(`${success ? '✅' : '❌'} [STEP ${step}] ${msg}`);
};

async function runTests() {
    console.log("🚀 Starting Full System Verification...\n");
    let step = 1;

    // --- STEP 1: Server Health Check ---
    try {
        // We don't have a health endpoint, but 'browse' with no args returns drives on Windows
        await axios.get(`${API_URL}/browse`);
        log(step++, "Server is reachable");
    } catch (e) {
        log(step++, `Server connection failed: ${e.message}`, false);
        process.exit(1);
    }

    // --- STEP 2: Browser Functionality ---
    try {
        const res = await axios.get(`${API_URL}/browse`);
        if (Array.isArray(res.data) && res.data.length > 0) {
            log(step++, `System Browse working (Found ${res.data.length} drives/roots)`);
        } else {
            throw new Error("Empty browse result");
        }
    } catch (e) {
        log(step++, `Browser test failed: ${e.message}`, false);
    }

    // --- STEP 3: Scan Directory ---
    try {
        console.log(`    ... Scanning ${TARGET_DIR}`);
        const res = await axios.post(`${API_URL}/scan`, { path: TARGET_DIR });
        if (res.data.success && res.data.stats) {
            log(step++, `Scan successful (Files: ${res.data.stats.files}, Dirs: ${res.data.stats.directories})`);
        } else {
            throw new Error("Invalid scan response");
        }
    } catch (e) {
        log(step++, `Scan failed: ${e.message}`, false);
    }

    // --- STEP 4: List Files & Verify Structure ---
    let testFileId = null;
    let testFileName = null;
    try {
        const res = await axios.get(`${API_URL}/files`, { params: { parentPath: TARGET_DIR } });
        if (res.data.length > 0) {
            log(step++, `List Files successful (Retrieved ${res.data.length} items)`);

            // Validation: Check if correct sorting or properties exist
            const file = res.data.find(f => f.type === 'file');
            if (file) {
                testFileId = file.id;
                testFileName = file.name;
                // Verify new columns exist
                if (file.tags !== undefined && file.importance !== undefined) {
                    log(step++, "Schema Verification: 'tags' and 'importance' columns exist");
                } else {
                    log(step++, "Schema Verification FAILED: Missing new columns", false);
                }
            }
        } else {
            log(step++, "List Files returned empty array (Unexpected for src dir)", false);
        }
    } catch (e) {
        log(step++, `List Files failed: ${e.message}`, false);
    }

    // --- STEP 5: Metadata Update (Tags & Importance) ---
    if (testFileId) {
        try {
            const tags = "unit_test,verified";
            const importance = "high";

            await axios.patch(`${API_URL}/file/${testFileId}/metadata`, { tags, importance });
            log(step++, `Metadata Update triggered for '${testFileName}'`);

            // Verify read-back
            const res = await axios.get(`${API_URL}/file/${testFileId}`);
            if (res.data.tags === tags && res.data.importance === importance) {
                log(step++, "Metadata Read-Back verification PASSED");
            } else {
                log(step++, `Metadata Read-Back FAILED. Got: ${JSON.stringify(res.data)}`, false);
            }
        } catch (e) {
            log(step++, `Metadata Update failed: ${e.message}`, false);
        }
    } else {
        log(step++, "Skipping Metadata test (No file found)", false);
    }

    // --- STEP 6: Persistence Check (Re-Scan) ---
    if (testFileId) {
        try {
            console.log(`    ... Re-scanning ${TARGET_DIR} to test persistence`);
            await axios.post(`${API_URL}/scan`, { path: TARGET_DIR });

            const res = await axios.get(`${API_URL}/file/${testFileId}`);
            if (res.data.tags === "unit_test,verified" && res.data.importance === "high") {
                log(step++, "Persistence Verification PASSED (Tags survived re-scan)");
            } else {
                log(step++, "Persistence Verification FAILED (Tags lost)", false);
            }
        } catch (e) {
            log(step++, `Persistence test failed: ${e.message}`, false);
        }
    }

    // --- STEP 7: Search Functionality ---
    try {
        const query = testFileName.substring(0, 3); // Update: search for substring of file name
        const res = await axios.get(`${API_URL}/files`, { params: { query } });
        const found = res.data.find(f => f.id === testFileId);
        if (found) {
            log(step++, `Search functionality PASSED (Found '${testFileName}' by query '${query}')`);
        } else {
            log(step++, `Search functionality FAILED (Could not find '${testFileName}')`, false);
        }
    } catch (e) {
        log(step++, `Search test failed: ${e.message}`, false);
    }

    console.log("\n✅ All System Tests Completed.");
}

runTests();
