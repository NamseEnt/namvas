import { getSession, putSession } from './index.js';

async function testSessionCRUD() {
    console.log('🧪 Testing Session CRUD operations...\n');
    
    const testSession = {
        id: 'test-session-' + Date.now(),
        userId: 'user-123'
    };
    
    try {
        // Test 1: Get non-existent session
        console.log('1️⃣ Testing getSession with non-existent ID...');
        const nonExistent = await getSession({ id: 'non-existent-id' });
        console.log('   Result:', nonExistent);
        if (nonExistent === null || nonExistent === undefined) {
            console.log('   ✅ Correctly returned null/undefined for non-existent session\n');
        } else {
            console.log('   ❌ Expected null/undefined but got:', nonExistent, '\n');
        }
        
        // Test 2: Put session
        console.log('2️⃣ Testing putSession...');
        console.log('   Inserting:', testSession);
        await putSession(testSession);
        console.log('   ✅ Session inserted successfully\n');
        
        // Test 3: Get existing session
        console.log('3️⃣ Testing getSession with existing ID...');
        const retrieved = await getSession({ id: testSession.id });
        console.log('   Retrieved:', retrieved);
        
        if (retrieved && retrieved.id === testSession.id && retrieved.userId === testSession.userId) {
            console.log('   ✅ Successfully retrieved the correct session\n');
        } else {
            console.log('   ❌ Retrieved session does not match expected data\n');
            console.log('   Expected:', testSession);
            console.log('   Got:', retrieved, '\n');
        }
        
        // Test 4: Update session
        console.log('4️⃣ Testing session update...');
        const updatedSession = {
            ...testSession,
            userId: 'user-456-updated'
        };
        console.log('   Updating to:', updatedSession);
        await putSession(updatedSession);
        
        const retrievedUpdated = await getSession({ id: testSession.id });
        console.log('   Retrieved after update:', retrievedUpdated);
        
        if (retrievedUpdated && retrievedUpdated.userId === 'user-456-updated') {
            console.log('   ✅ Session updated successfully\n');
        } else {
            console.log('   ❌ Session update failed\n');
        }
        
        console.log('🎉 All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

if (import.meta.main) {
    testSessionCRUD();
}