const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const subjectGroups = [
  {
    name: 'Khoa học Tự nhiên (KHTN)',
    code: 'KHTN',
    description: 'Tổ hợp môn Vật lý, Hóa học, Sinh học',
    subjects: ['PHY', 'CHEM', 'BIO']
  },
  {
    name: 'Khoa học Xã hội (KHXH)',
    code: 'KHXH',
    description: 'Tổ hợp môn Lịch sử, Địa lý, GDCD',
    subjects: ['HIST', 'GEO', 'CIVIC']
  }
];

async function seedVietnamEducation() {
  try {
    console.log('🇻🇳 Seeding Vietnamese Education System Data...');

    // 1. Seed Subject Groups
    for (const group of subjectGroups) {
      // Check if group exists
      const { data: existingGroup } = await supabase
        .from('subject_groups')
        .select('id')
        .eq('code', group.code)
        .single();

      let groupId;

      if (existingGroup) {
        console.log(`ℹ️  Subject Group ${group.code} already exists.`);
        groupId = existingGroup.id;
      } else {
        const { data: newGroup, error } = await supabase
          .from('subject_groups')
          .insert({
            name: group.name,
            code: group.code,
            description: group.description
          })
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Error creating group ${group.code}:`, error);
          continue;
        }
        console.log(`✅ Created Subject Group: ${group.name}`);
        groupId = newGroup.id;
      }

      // 2. Link Subjects to Group
      if (groupId) {
        for (const subjectCode of group.subjects) {
          // Find subject by code
          const { data: subject } = await supabase
            .from('subjects')
            .select('id')
            .eq('code', subjectCode)
            .single();

          if (subject) {
            // Check if link exists
            const { data: existingLink } = await supabase
              .from('subject_group_subjects')
              .select('id')
              .eq('subject_group_id', groupId)
              .eq('subject_id', subject.id)
              .single();

            if (!existingLink) {
              await supabase
                .from('subject_group_subjects')
                .insert({
                  subject_group_id: groupId,
                  subject_id: subject.id,
                  is_mandatory: true
                });
              console.log(`   🔗 Linked ${subjectCode} to ${group.code}`);
            }
          } else {
            console.log(`   ⚠️  Subject ${subjectCode} not found.`);
          }
        }
      }
    }

    console.log('🎉 Vietnamese Education Data Seeding Completed!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

seedVietnamEducation();