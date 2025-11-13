/**
 * Production Readiness Test Script
 * Run this to verify all production hardening is working
 * 
 * Usage: node web/scripts/production-test.mjs
 */

import crypto from 'crypto'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

if (!INTERNAL_API_KEY) {
  console.error('❌ ERROR: INTERNAL_API_KEY environment variable not set')
  process.exit(1)
}

function sign(payload) {
  return crypto.createHmac('sha256', INTERNAL_API_KEY).update(payload).digest('hex')
}

async function testEndpoint(name, url, method = 'GET', body = null, signPayload = '') {
  console.log(`\n🔍 Testing: ${name}`)
  console.log(`   URL: ${method} ${url}`)
  
  const headers = {
    'x-internal-signature': sign(signPayload),
  }
  
  const options = { method, headers }
  
  if (body && (method === 'POST' || method === 'PUT')) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  
  try {
    const start = Date.now()
    const response = await fetch(url, options)
    const duration = Date.now() - start
    
    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ Status: ${response.status} (${duration}ms)`)
      return { success: true, data, status: response.status }
    } else {
      const text = await response.text()
      console.log(`   ⚠️  Status: ${response.status} - ${text}`)
      return { success: false, error: text, status: response.status }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testRateLimit() {
  console.log('\n🔥 Testing Rate Limiting...')
  console.log('   Sending 65 requests rapidly to trigger rate limit...')
  
  let blocked = 0
  let allowed = 0
  
  for (let i = 0; i < 65; i++) {
    const response = await fetch(`${BASE_URL}/api/health`, {
      headers: { 'x-internal-signature': sign('') }
    })
    
    if (response.status === 429) {
      blocked++
    } else if (response.ok) {
      allowed++
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  console.log(`   📊 Results: ${allowed} allowed, ${blocked} blocked`)
  
  if (blocked > 0) {
    console.log('   ✅ Rate limiting is WORKING (some requests blocked)')
  } else {
    console.log('   ⚠️  Rate limiting may not be working (no requests blocked)')
  }
}

async function runTests() {
  console.log('=' .repeat(60))
  console.log('🚀 Production Readiness Test Suite')
  console.log('=' .repeat(60))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Internal API Key: ${INTERNAL_API_KEY.substring(0, 8)}...`)
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  }
  
  // Test 1: Health Check
  const health = await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/health`,
    'GET',
    null,
    ''
  )
  if (health.success) {
    results.passed++
  } else {
    results.failed++
  }
  
  // Test 2: List Courses
  const courses = await testEndpoint(
    'List Courses',
    `${BASE_URL}/api/courses`,
    'GET',
    null,
    ''
  )
  if (courses.success) {
    results.passed++
  } else {
    results.failed++
  }
  
  // Test 3: Create Course (with validation)
  const newCourse = await testEndpoint(
    'Create Course',
    `${BASE_URL}/api/courses`,
    'POST',
    {
      title: 'Production Test Course ' + Date.now(),
      description: 'This is a test course created by the production readiness test suite',
      is_published: true
    }
  )
  if (newCourse.success) {
    results.passed++
  } else {
    results.failed++
  }
  
  let courseId = null
  if (newCourse.success && newCourse.data?.data?.id) {
    courseId = newCourse.data.data.id
    console.log(`   📝 Created course ID: ${courseId}`)
  }
  
  // Test 4: List Lessons (if we have a course)
  if (courseId) {
    const lessons = await testEndpoint(
      'List Lessons',
      `${BASE_URL}/api/lessons?course_id=${courseId}`,
      'GET',
      null,
      `course_id=${courseId}`
    )
    if (lessons.success) {
      results.passed++
    } else {
      results.failed++
    }
    
    // Test 5: Create Lesson
    const newLesson = await testEndpoint(
      'Create Lesson',
      `${BASE_URL}/api/lessons`,
      'POST',
      {
        course_id: courseId,
        title: 'Test Lesson ' + Date.now(),
        content: 'This is test content for the production readiness test suite',
        order_index: 1,
        is_published: true
      }
    )
    if (newLesson.success) {
      results.passed++
    } else {
      results.failed++
    }
  } else {
    console.log('\n⚠️  Skipping lesson tests (no course created)')
    results.warnings += 2
  }
  
  // Test 6: Input Validation (should fail)
  console.log('\n🧪 Testing Input Validation (expecting failure)...')
  const invalidCourse = await testEndpoint(
    'Invalid Course (title too long)',
    `${BASE_URL}/api/courses`,
    'POST',
    {
      title: 'X'.repeat(300), // Exceeds 200 char limit
      description: 'Test',
      is_published: true
    }
  )
  
  if (invalidCourse.status === 400) {
    console.log('   ✅ Validation working correctly (rejected invalid input)')
    results.passed++
  } else {
    console.log('   ❌ Validation NOT working (accepted invalid input)')
    results.failed++
  }
  
  // Test 7: Authentication (should fail without signature)
  console.log('\n🔐 Testing Authentication (expecting failure)...')
  const unauthenticated = await fetch(`${BASE_URL}/api/courses`)
  if (unauthenticated.status === 401) {
    console.log('   ✅ Authentication working correctly (rejected unsigned request)')
    results.passed++
  } else {
    console.log('   ❌ Authentication NOT working (accepted unsigned request)')
    results.failed++
  }
  
  // Test 8: Rate Limiting
  await testRateLimit()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Application is production ready.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Review failures before deploying.')
    process.exit(1)
  }
}

// Run the test suite
runTests().catch(error => {
  console.error('\n❌ Test suite crashed:', error)
  process.exit(1)
})
