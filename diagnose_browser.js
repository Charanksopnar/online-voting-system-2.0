/**
 * Browser Console Diagnostic Script
 * 
 * Copy and paste this into your browser console (F12) 
 * while on the Voter Lists Verification page
 */

console.log('🔍 Starting Diagnostic Check...\n');

// 1. Check if RealtimeContext is loaded
console.log('1️⃣ Checking RealtimeContext...');
try {
    const contextCheck = document.querySelector('[data-context="realtime"]');
    console.log('   RealtimeContext element:', contextCheck ? 'Found' : 'Not found');
} catch (e) {
    console.log('   Could not check context element');
}

// 2. Check localStorage for user info
console.log('\n2️⃣ Checking User Session...');
const userRole = localStorage.getItem('lastUserRole');
const userId = localStorage.getItem('userId');
console.log('   User Role:', userRole || 'Not set');
console.log('   User ID:', userId || 'Not set');

// 3. Check Supabase connection
console.log('\n3️⃣ Checking Supabase...');
console.log('   Check Network tab for requests to supabase.co');
console.log('   Look for "official_voter_lists" table queries');

// 4. Instructions for manual check
console.log('\n4️⃣ Manual Checks:');
console.log('   ✓ Open Network tab (F12 → Network)');
console.log('   ✓ Refresh the page');
console.log('   ✓ Look for requests to "official_voter_lists"');
console.log('   ✓ Check if they return 200 OK or errors');
console.log('   ✓ Look at the Response to see if data is returned');

// 5. Check for React component state
console.log('\n5️⃣ React Component Check:');
console.log('   Look for console logs starting with:');
console.log('   - "🔍 VoterListsVerification - Data Check"');
console.log('   - "✅ Loaded X official voter records"');
console.log('   These logs show if data is loading');

console.log('\n📋 Next Steps:');
console.log('   1. Check the console logs above');
console.log('   2. Look at Network tab for API calls');
console.log('   3. Run the SQL queries in diagnose_voter_lists.sql');
console.log('   4. Report what you find');

console.log('\n✅ Diagnostic check complete!');
