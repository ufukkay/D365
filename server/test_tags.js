const axios = require('axios');

async function testPersistence() {
    const API_URL = 'http://localhost:3001/api';
    const TEST_PATH = 'c:\\Users\\Ufuk\\Desktop\\D365\\client\\src';

    console.log("1. Scanning directory...");
    await axios.post(`${API_URL}/scan`, { path: TEST_PATH });

    console.log("2. Fetching a file to tag...");
    const filesRes = await axios.get(`${API_URL}/files`, { params: { parentPath: TEST_PATH } });
    const file = filesRes.data.find(f => f.type === 'file');

    if (!file) {
        console.error("No file found to test!");
        return;
    }
    console.log(`   Target File: ${file.name} (ID: ${file.id})`);

    console.log("3. Setting Metadata (Tags: #test, Importance: high)...");
    await axios.patch(`${API_URL}/file/${file.id}/metadata`, {
        tags: 'test,demo',
        importance: 'high'
    });

    console.log("4. Verifying Metadata Update...");
    const updatedFile = (await axios.get(`${API_URL}/file/${file.id}`)).data;
    if (updatedFile.tags === 'test,demo' && updatedFile.importance === 'high') {
        console.log("   SUCCESS: Metadata set correctly.");
    } else {
        console.error("   FAIL: Metadata not set.", updatedFile);
        return;
    }

    console.log("5. Re-Scanning (Testing Persistence)...");
    await axios.post(`${API_URL}/scan`, { path: TEST_PATH });

    console.log("6. Verifying Persistence...");
    const finalFile = (await axios.get(`${API_URL}/file/${file.id}`)).data;

    if (finalFile.tags === 'test,demo' && finalFile.importance === 'high') {
        console.log("   ✅ PASSED: Tags and Importance persisted after re-scan!");
    } else {
        console.error("   ❌ FAILED: Metadata lost after re-scan.", finalFile);
    }
}

testPersistence().catch(err => console.error(err.message));
