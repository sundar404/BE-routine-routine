#!/bin/bash

# Test PDF Generation for Routine Export
echo "🔍 Testing PDF Generation System..."

# Test the routine export endpoint
curl -X GET "http://localhost:5000/api/pdf/routine/export?programCode=BCT&semester=5&section=AB" \
  -H "Accept: application/pdf" \
  -o "test_routine_export.pdf" \
  --fail --show-error --silent

if [ $? -eq 0 ]; then
    echo "✅ PDF Export Test PASSED - File generated successfully"
    echo "📁 Check test_routine_export.pdf in current directory"
    ls -la test_routine_export.pdf
else
    echo "❌ PDF Export Test FAILED"
fi

echo ""
echo "🔍 Testing API Endpoints..."

# Test if API routes are accessible
curl -X GET "http://localhost:5000/api/pdf/routine/export" \
  --fail --show-error --silent --max-time 5 > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ PDF API Routes are accessible"
else
    echo "❌ PDF API Routes are not accessible - check if server is running"
fi
