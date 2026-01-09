#!/bin/bash

# Data Sync Test Script
# Run with: bash scripts/test-data-sync.sh

BASE_URL="http://localhost:3000"

echo "🔍 TESTING DATA SYNC"
echo "===================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
  local name=$1
  local endpoint=$2
  
  echo -n "Testing $name... "
  
  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    data_count=$(echo "$body" | jq '.students, .data, .classes | length' 2>/dev/null | head -1)
    if [ -z "$data_count" ] || [ "$data_count" = "null" ]; then
      data_count=$(echo "$body" | jq '. | length' 2>/dev/null)
    fi
    
    if [ "$data_count" -gt 0 ] 2>/dev/null; then
      echo -e "${GREEN}✅ OK${NC} ($data_count records)"
    else
      echo -e "${YELLOW}⚠️ Empty${NC}"
      echo "   Response: $(echo "$body" | jq -c '.' 2>/dev/null | head -c 100)"
    fi
  else
    echo -e "${RED}❌ HTTP $http_code${NC}"
    echo "   Response: $(echo "$body" | jq -c '.error' 2>/dev/null || echo "$body" | head -c 100)"
  fi
}

# Test endpoints
echo "📊 API ENDPOINTS:"
test_endpoint "Students" "/api/admin/students?limit=1"
test_endpoint "Classes" "/api/classes"
test_endpoint "Attendance" "/api/attendance?limit=1"
test_endpoint "Courses" "/api/admin/courses?limit=1"
test_endpoint "Academic Years" "/api/admin/academic-years?limit=1"
test_endpoint "Fee Types" "/api/admin/fee-types?limit=1"
test_endpoint "Users" "/api/admin/users?limit=1"

echo ""
echo "🔧 DIAGNOSTIC:"
test_endpoint "Diagnostic" "/api/debug/diagnose"

echo ""
echo "✅ Test complete!"
