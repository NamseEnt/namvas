#!/bin/bash

# LLRT Test Runner Script
# This script downloads LLRT runtime and runs compatibility tests

echo "🚀 LLRT Compatibility Testing"
echo "============================"
echo ""

# Detect platform
OS=$(uname -s)
ARCH=$(uname -m)

case $OS in
    Darwin)
        if [ "$ARCH" = "arm64" ]; then
            PLATFORM="darwin-arm64"
        else
            PLATFORM="darwin-x64"
        fi
        LLRT_BINARY="llrt"
        ;;
    Linux)
        if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
            PLATFORM="linux-arm64"
        else
            PLATFORM="linux-x64"
        fi
        LLRT_BINARY="llrt"
        ;;
    *)
        echo "❌ Unsupported platform: $OS $ARCH"
        exit 1
        ;;
esac

LLRT_VERSION="v0.3.0-beta"
LLRT_DIR="./llrt-runtime"
LLRT_PATH="$LLRT_DIR/$LLRT_BINARY"

# Download LLRT if not exists
if [ ! -f "$LLRT_PATH" ]; then
    echo "📥 Downloading LLRT runtime for $PLATFORM..."
    
    # Create directory
    mkdir -p "$LLRT_DIR"
    
    # Download URL
    DOWNLOAD_URL="https://github.com/awslabs/llrt/releases/download/$LLRT_VERSION/llrt-$PLATFORM.zip"
    
    echo "Downloading from: $DOWNLOAD_URL"
    
    # Download and extract
    curl -L -o "$LLRT_DIR/llrt.zip" "$DOWNLOAD_URL"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to download LLRT runtime"
        exit 1
    fi
    
    # Extract
    cd "$LLRT_DIR"
    unzip -q llrt.zip
    rm llrt.zip
    cd ..
    
    # Make executable
    chmod +x "$LLRT_PATH"
    
    echo "✅ LLRT runtime downloaded successfully"
else
    echo "✅ LLRT runtime already exists at $LLRT_PATH"
fi

echo ""

# Build the project for LLRT
echo "🔨 Building project for LLRT..."
npm run build:llrt

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Build test files
echo "🔨 Building test files..."
npm run build:tests

if [ $? -ne 0 ]; then
    echo "❌ Test build failed"
    exit 1
fi

echo "✅ Test build completed successfully"
echo ""

# Run tests
echo "🧪 Running LLRT compatibility tests..."
echo ""

TEST_PASSED=true

# Test each built test file
for test_file in dist/tests/*.test.js; do
    if [ -f "$test_file" ]; then
        test_name=$(basename "$test_file" .js)
        echo "📋 Testing: $test_name"
        echo "─────────────────────────────────────────────────"
        
        # Create test environment setup
        cat > temp_test_setup.mjs << EOF
// Mock environment for tests
globalThis.process = globalThis.process || {
    env: {
        AWS_REGION: 'us-east-1'
    }
};

// Mock db module
globalThis.__mockModules = globalThis.__mockModules || new Map();
globalThis.__mockModules.set('db', {
    dbClient: {
        get: async (args) => ({ Item: undefined }),
        put: async (args) => {},
        query: async (args) => ({ Items: [] }),
        send: async (command) => ({})
    },
    putSession: async (data) => {},
    putAccount: async (data) => {},
    putIdentity: async (data) => {},
    getSession: async (args) => undefined
});

try {
    await import('./$test_file');
    console.log('✅ All tests in $test_name completed successfully');
} catch (err) {
    console.error('❌ Test failed:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
    process.exit(1);
}
EOF
        
        "$LLRT_PATH" temp_test_setup.mjs
        
        if [ $? -ne 0 ]; then
            TEST_PASSED=false
            echo "❌ Test failed: $test_name"
        else
            echo "✅ Test passed: $test_name"
        fi
        
        rm temp_test_setup.mjs
        echo ""
    fi
done

# Test Lambda handler
echo "🚀 Testing Lambda Handler"
echo "─────────────────────────────────────────────────"

cat > temp_handler_test.mjs << EOF
// Set up mock environment for LLRT testing
globalThis.process = globalThis.process || {
    env: {
        // Don't set LAMBDA=true so LLRT LocalDBDocument is used
        AWS_REGION: 'us-east-1'
    }
};

// Mock db module since it's externalized
const mockDbClient = {
    get: async (args) => ({ Item: undefined }),
    put: async (args) => {},
    query: async (args) => ({ Items: [] }),
    send: async (command) => ({})
};

// Create module resolver for 'db' module
const originalImport = globalThis[Symbol.for('nodejs.util.promisify.custom')] || globalThis.import;

globalThis.__mockModules = globalThis.__mockModules || new Map();
globalThis.__mockModules.set('db', {
    dbClient: mockDbClient,
    putSession: async (data) => {},
    putAccount: async (data) => {},
    putIdentity: async (data) => {},
    getSession: async (args) => undefined
});

try {
    const module = await import('./dist/index.js');
    console.log('✅ Lambda handler module loaded successfully');
    
    if (typeof module.handler === 'function') {
        console.log('✅ Handler function is available');
        
        // Test a simple health check request (API Gateway format)
        const testEvent = {
            httpMethod: 'GET',
            path: '/health',
            headers: {},
            body: null
        };
        
        const testContext = {
            awsRequestId: 'test-request-id',
            functionName: 'test-function'
        };
        
        try {
            const response = await module.handler(testEvent, testContext);
            console.log('✅ Handler executed successfully');
            console.log('Response status:', response.statusCode);
            console.log('Response body:', response.body);
            
            if (response.statusCode === 200 && response.body === 'OK') {
                console.log('✅ Health check response is correct');
                console.log('✅ LLRT compatibility confirmed!');
            } else {
                console.error('❌ Unexpected response format');
                console.error('Expected: statusCode=200, body="OK"');
                console.error('Got:', JSON.stringify(response));
                process.exit(1);
            }
        } catch (err) {
            console.error('❌ Handler execution failed:', err.message);
            if (err.stack) console.error('Stack:', err.stack);
            process.exit(1);
        }
    } else {
        console.error('❌ Handler function not found in module');
        console.error('Available exports:', Object.keys(module));
        process.exit(1);
    }
} catch (err) {
    console.error('❌ Failed to load handler module:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
    process.exit(1);
}
EOF

"$LLRT_PATH" temp_handler_test.mjs

if [ $? -ne 0 ]; then
    TEST_PASSED=false
    echo "❌ Lambda handler test failed"
else
    echo "✅ Lambda handler test passed"
fi

rm temp_handler_test.mjs

echo ""
echo "=============================================="

if [ "$TEST_PASSED" = true ]; then
    echo "✅ All LLRT compatibility tests passed!"
    exit 0
else
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi