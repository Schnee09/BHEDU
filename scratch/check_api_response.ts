
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const internalKey = process.env.INTERNAL_API_KEY;

async function checkApiResponse() {
  const classId = 'f6185432-f927-45bd-b802-ca79fc13b5ae';
  console.log(`Checking API response for class: ${classId}`);

  const response = await fetch(`${baseUrl}/api/classes/${classId}/enrollments`, {
    headers: {
      'x-internal-key': internalKey || '',
      // We might need a real auth token if teacherAuth checks for session
    }
  });

  if (!response.ok) {
    console.error('API request failed:', response.status, await response.text());
    return;
  }

  const data = await response.json();
  console.log('API Response Data (first student):', JSON.stringify(data.data?.[0], null, 2));
}

checkApiResponse();
