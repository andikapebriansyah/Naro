// Simple test script to verify worker-jobs API
// Run this with: node test-worker-jobs.js

const testWorkerJobsAPI = async () => {
  try {
    console.log('🧪 Testing worker-jobs API...');
    
    // This would normally require authentication
    // For now, we'll just test the endpoint exists
    const response = await fetch('http://localhost:3001/api/worker-jobs');
    
    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ API endpoint exists (401 = need auth)');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ API response:', data);
    } else {
      console.log('❌ API error:', response.statusText);
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Test if server is running
const testServer = async () => {
  try {
    const response = await fetch('http://localhost:3001/');
    console.log('🌐 Server status:', response.status);
  } catch (error) {
    console.log('❌ Server not running:', error.message);
  }
};

console.log('=== WORKER JOBS API TEST ===');
testServer().then(() => testWorkerJobsAPI());