const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Vietnamese curriculum standards data
const curriculumStandards = [
  // Toán học (Mathematics)
  {
    subject_code: 'MATH',
    grade_level: '10',
    standard_code: 'MATH-10-1',
    title: 'Hàm số và giới hạn',
    description: 'Khái niệm hàm số, giới hạn và tính liên tục',
    learning_objectives: [
      'Hiểu và vận dụng khái niệm hàm số',
      'Tính giới hạn của hàm số tại một điểm',
      'Xác định tính liên tục của hàm số',
      'Giải các bài toán ứng dụng về giới hạn'
    ],
    competencies: [
      'Phân tích và suy luận logic',
      'Giải quyết vấn đề toán học',
      'Ứng dụng toán học trong thực tế'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'MATH',
    grade_level: '11',
    standard_code: 'MATH-11-1',
    title: 'Đạo hàm và ứng dụng',
    description: 'Khái niệm đạo hàm và các ứng dụng',
    learning_objectives: [
      'Tính đạo hàm của hàm số cơ bản',
      'Ứng dụng đạo hàm trong hình học',
      'Ứng dụng đạo hàm trong vật lý',
      'Giải phương trình và bất phương trình'
    ],
    competencies: [
      'Kỹ năng tính toán',
      'Phân tích hàm số',
      'Ứng dụng đạo hàm'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'MATH',
    grade_level: '12',
    standard_code: 'MATH-12-1',
    title: 'Tích phân và ứng dụng',
    description: 'Khái niệm tích phân và các ứng dụng',
    learning_objectives: [
      'Tính tích phân xác định và không xác định',
      'Ứng dụng tích phân tính diện tích',
      'Ứng dụng tích phân tính thể tích',
      'Giải phương trình vi phân'
    ],
    competencies: [
      'Kỹ năng tích phân',
      'Ứng dụng hình học',
      'Giải quyết vấn đề phức tạp'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Ngữ văn (Literature)
  {
    subject_code: 'LIT',
    grade_level: '10',
    standard_code: 'LIT-10-1',
    title: 'Văn học trung đại Việt Nam',
    description: 'Tác phẩm văn học trung đại và phương pháp phân tích',
    learning_objectives: [
      'Phân tích tác phẩm văn học trung đại',
      'Hiểu bối cảnh lịch sử xã hội',
      'Viết phân tích tác phẩm',
      'Thuyết trình và thảo luận'
    ],
    competencies: [
      'Phân tích văn bản',
      'Viết luận văn học',
      'Thuyết trình và giao tiếp'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'LIT',
    grade_level: '11',
    standard_code: 'LIT-11-1',
    title: 'Văn học hiện đại Việt Nam',
    description: 'Tác phẩm văn học hiện đại và phê bình văn học',
    learning_objectives: [
      'Phân tích văn học hiện đại',
      'Hiểu các trào lưu văn học',
      'Viết phê bình văn học',
      'Nghiên cứu tác giả và tác phẩm'
    ],
    competencies: [
      'Phân tích phê bình',
      'Viết luận nâng cao',
      'Nghiên cứu văn học'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'LIT',
    grade_level: '12',
    standard_code: 'LIT-12-1',
    title: 'Văn học thế giới và so sánh',
    description: 'Văn học thế giới và phương pháp so sánh văn học',
    learning_objectives: [
      'So sánh văn học Việt Nam và thế giới',
      'Phân tích tác phẩm văn học thế giới',
      'Viết luận so sánh',
      'Nghiên cứu văn hóa qua văn học'
    ],
    competencies: [
      'So sánh văn học',
      'Viết luận chuyên sâu',
      'Hiểu biết văn hóa'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Tiếng Anh (English)
  {
    subject_code: 'ENG',
    grade_level: '10',
    standard_code: 'ENG-10-1',
    title: 'Tiếng Anh cơ bản',
    description: 'Ngữ pháp và từ vựng cơ bản, kỹ năng giao tiếp',
    learning_objectives: [
      'Sử dụng ngữ pháp cơ bản chính xác',
      'Mở rộng từ vựng chủ đề hàng ngày',
      'Luyện kỹ năng nghe hiểu',
      'Thực hành kỹ năng nói cơ bản'
    ],
    competencies: [
      'Giao tiếp tiếng Anh',
      'Nghe hiểu và nói',
      'Đọc hiểu văn bản'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'ENG',
    grade_level: '11',
    standard_code: 'ENG-11-1',
    title: 'Tiếng Anh trung cấp',
    description: 'Ngữ pháp nâng cao và kỹ năng học thuật',
    learning_objectives: [
      'Sử dụng cấu trúc ngữ pháp phức tạp',
      'Đọc hiểu văn bản học thuật',
      'Viết đoạn văn và bài luận',
      'Thảo luận chủ đề nâng cao'
    ],
    competencies: [
      'Viết luận tiếng Anh',
      'Đọc hiểu chuyên sâu',
      'Thảo luận học thuật'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'ENG',
    grade_level: '12',
    standard_code: 'ENG-12-1',
    title: 'Tiếng Anh nâng cao',
    description: 'Chuẩn bị cho các kỳ thi quốc tế và học thuật',
    learning_objectives: [
      'Chuẩn bị cho TOEFL/IELTS',
      'Viết luận học thuật',
      'Phân tích văn bản phức tạp',
      'Thuyết trình bằng tiếng Anh'
    ],
    competencies: [
      'Viết luận chuyên sâu',
      'Thuyết trình tiếng Anh',
      'Chuẩn bị thi quốc tế'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Vật lý (Physics)
  {
    subject_code: 'PHY',
    grade_level: '10',
    standard_code: 'PHY-10-1',
    title: 'Động học và động lực học',
    description: 'Chuyển động và lực, định luật Newton',
    learning_objectives: [
      'Phân tích chuyển động thẳng đều',
      'Hiểu và vận dụng định luật Newton',
      'Tính toán lực và gia tốc',
      'Giải bài toán vật lý thực tế'
    ],
    competencies: [
      'Phân tích chuyển động',
      'Giải quyết vấn đề vật lý',
      'Tính toán và đo lường'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'PHY',
    grade_level: '11',
    standard_code: 'PHY-11-1',
    title: 'Năng lượng và điện từ',
    description: 'Công và năng lượng, điện trường và từ trường',
    learning_objectives: [
      'Tính công và năng lượng',
      'Hiểu định luật bảo toàn năng lượng',
      'Phân tích điện trường',
      'Nghiên cứu từ trường'
    ],
    competencies: [
      'Phân tích năng lượng',
      'Hiểu điện từ học',
      'Thí nghiệm vật lý'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'PHY',
    grade_level: '12',
    standard_code: 'PHY-12-1',
    title: 'Vật lý lượng tử và hạt nhân',
    description: 'Cơ học lượng tử và vật lý hạt nhân',
    learning_objectives: [
      'Hiểu hiệu ứng quang điện',
      'Nghiên cứu vật lý hạt nhân',
      'Phân tích cấu trúc nguyên tử',
      'Ứng dụng công nghệ hạt nhân'
    ],
    competencies: [
      'Hiểu vật lý hiện đại',
      'Phân tích lượng tử',
      'Nghiên cứu hạt nhân'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Hóa học (Chemistry)
  {
    subject_code: 'CHEM',
    grade_level: '10',
    standard_code: 'CHEM-10-1',
    title: 'Cấu tạo nguyên tử và liên kết',
    description: 'Nguyên tử, phân tử và các loại liên kết',
    learning_objectives: [
      'Hiểu cấu tạo nguyên tử',
      'Phân loại liên kết hóa học',
      'Viết công thức hóa học',
      'Thực hành thí nghiệm cơ bản'
    ],
    competencies: [
      'Hiểu cấu tạo vật chất',
      'Thí nghiệm hóa học',
      'Tính toán hóa học'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'CHEM',
    grade_level: '11',
    standard_code: 'CHEM-11-1',
    title: 'Phản ứng hóa học và nhiệt hóa',
    description: 'Các loại phản ứng và nhiệt động hóa học',
    learning_objectives: [
      'Phân loại phản ứng hóa học',
      'Tính nhiệt phản ứng',
      'Hiểu động học hóa học',
      'Thí nghiệm phản ứng'
    ],
    competencies: [
      'Phân tích phản ứng',
      'Tính toán nhiệt hóa',
      'Thí nghiệm nâng cao'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'CHEM',
    grade_level: '12',
    standard_code: 'CHEM-12-1',
    title: 'Hóa học hữu cơ và polymer',
    description: 'Hydrocarbon và polymer, hóa dược',
    learning_objectives: [
      'Phân tích hợp chất hữu cơ',
      'Hiểu polymer và ứng dụng',
      'Nghiên cứu hóa dược',
      'Thí nghiệm hữu cơ'
    ],
    competencies: [
      'Hiểu hóa hữu cơ',
      'Nghiên cứu polymer',
      'Thí nghiệm chuyên sâu'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Sinh học (Biology)
  {
    subject_code: 'BIO',
    grade_level: '10',
    standard_code: 'BIO-10-1',
    title: 'Cơ chế di truyền và biến dị',
    description: 'Di truyền và biến dị ở sinh vật',
    learning_objectives: [
      'Hiểu quy luật di truyền Mendel',
      'Phân tích biến dị di truyền',
      'Nghiên cứu ADN và ARN',
      'Thí nghiệm di truyền'
    ],
    competencies: [
      'Hiểu di truyền học',
      'Phân tích gen',
      'Thí nghiệm sinh học'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'BIO',
    grade_level: '11',
    standard_code: 'BIO-11-1',
    title: 'Tiến hóa và đa dạng sinh học',
    description: 'Tiến hóa và bảo tồn đa dạng sinh học',
    learning_objectives: [
      'Hiểu lý thuyết tiến hóa',
      'Phân tích đa dạng sinh học',
      'Nghiên cứu bảo tồn',
      'Thí nghiệm sinh thái'
    ],
    competencies: [
      'Hiểu tiến hóa',
      'Nghiên cứu đa dạng',
      'Thực hành bảo tồn'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'BIO',
    grade_level: '12',
    standard_code: 'BIO-12-1',
    title: 'Công nghệ sinh học và ứng dụng',
    description: 'Công nghệ sinh học hiện đại và ứng dụng',
    learning_objectives: [
      'Hiểu công nghệ gen',
      'Nghiên cứu sinh sản vô tính',
      'Ứng dụng công nghệ sinh học',
      'Thí nghiệm công nghệ sinh học'
    ],
    competencies: [
      'Hiểu công nghệ sinh học',
      'Ứng dụng thực tiễn',
      'Thí nghiệm hiện đại'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Lịch sử (History)
  {
    subject_code: 'HIST',
    grade_level: '10',
    standard_code: 'HIST-10-1',
    title: 'Lịch sử thế giới cận đại',
    description: 'Cách mạng công nghiệp và các cuộc cách mạng',
    learning_objectives: [
      'Hiểu cách mạng công nghiệp',
      'Phân tích các cuộc cách mạng',
      'Nghiên cứu chủ nghĩa tư bản',
      'So sánh lịch sử Việt Nam và thế giới'
    ],
    competencies: [
      'Phân tích lịch sử',
      'So sánh văn hóa',
      'Nghiên cứu xã hội'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'HIST',
    grade_level: '11',
    standard_code: 'HIST-11-1',
    title: 'Lịch sử Việt Nam cận đại',
    description: 'Phong trào yêu nước và cách mạng tháng Tám',
    learning_objectives: [
      'Hiểu phong trào yêu nước',
      'Phân tích cách mạng tháng Tám',
      'Nghiên cứu Hồ Chí Minh',
      'Thảo luận lịch sử đương đại'
    ],
    competencies: [
      'Hiểu lịch sử dân tộc',
      'Phân tích chính trị',
      'Nghiên cứu xã hội'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'HIST',
    grade_level: '12',
    standard_code: 'HIST-12-1',
    title: 'Lịch sử thế giới hiện đại',
    description: 'Chiến tranh thế giới và thời kỳ hậu chiến',
    learning_objectives: [
      'Phân tích chiến tranh thế giới',
      'Hiểu thời kỳ Chiến tranh Lạnh',
      'Nghiên cứu toàn cầu hóa',
      'Thảo luận vấn đề đương đại'
    ],
    competencies: [
      'Phân tích địa chính trị',
      'Hiểu toàn cầu hóa',
      'Nghiên cứu đương đại'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },

  // Địa lý (Geography)
  {
    subject_code: 'GEO',
    grade_level: '10',
    standard_code: 'GEO-10-1',
    title: 'Địa lý tự nhiên châu Á',
    description: 'Địa hình, khí hậu và tài nguyên châu Á',
    learning_objectives: [
      'Phân tích địa hình châu Á',
      'Hiểu khí hậu và thời tiết',
      'Nghiên cứu tài nguyên thiên nhiên',
      'Thảo luận vấn đề môi trường'
    ],
    competencies: [
      'Phân tích địa lý',
      'Hiểu môi trường',
      'Nghiên cứu tài nguyên'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'GEO',
    grade_level: '11',
    standard_code: 'GEO-11-1',
    title: 'Địa lý kinh tế - xã hội',
    description: 'Kinh tế và xã hội các khu vực',
    learning_objectives: [
      'Phân tích kinh tế khu vực',
      'Hiểu cấu trúc xã hội',
      'Nghiên cứu đô thị hóa',
      'Thảo luận phát triển bền vững'
    ],
    competencies: [
      'Phân tích kinh tế',
      'Hiểu xã hội',
      'Nghiên cứu phát triển'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  },
  {
    subject_code: 'GEO',
    grade_level: '12',
    standard_code: 'GEO-12-1',
    title: 'Địa lý Việt Nam và thế giới',
    description: 'Địa lý toàn diện Việt Nam và xu hướng toàn cầu',
    learning_objectives: [
      'Phân tích địa lý Việt Nam',
      'Hiểu xu hướng toàn cầu',
      'Nghiên cứu biến đổi khí hậu',
      'Thảo luận địa chính trị'
    ],
    competencies: [
      'Phân tích toàn diện',
      'Hiểu xu hướng',
      'Nghiên cứu địa chính trị'
    ],
    assessment_criteria: [
      'Đạt yêu cầu: ≥ 5.0 điểm',
      'Khá: ≥ 6.5 điểm',
      'Giỏi: ≥ 8.0 điểm',
      'Xuất sắc: ≥ 9.0 điểm'
    ]
  }
];

async function seedCurriculumStandards() {
  try {
    console.log('🌱 Seeding Vietnamese curriculum standards...');

    // First, create the table if it doesn't exist
    console.log('📋 Creating curriculum_standards table if needed...');
    const createTableSQL = `
      DO $$
      BEGIN
        -- Create curriculum_standards table
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'curriculum_standards'
        ) THEN
          CREATE TABLE public.curriculum_standards (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            subject_id uuid NOT NULL,
            grade_level text NOT NULL,
            academic_year_id uuid NOT NULL,
            standard_code text NOT NULL,
            title text NOT NULL,
            description text,
            learning_objectives jsonb,
            competencies jsonb,
            assessment_criteria jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT curriculum_standards_pkey PRIMARY KEY (id),
            CONSTRAINT curriculum_standards_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
            CONSTRAINT curriculum_standards_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
          );

          -- Add indexes
          CREATE INDEX idx_curriculum_standards_subject ON curriculum_standards(subject_id);
          CREATE INDEX idx_curriculum_standards_grade ON curriculum_standards(grade_level);
          CREATE INDEX idx_curriculum_standards_year ON curriculum_standards(academic_year_id);

          COMMENT ON TABLE curriculum_standards IS 'Vietnamese curriculum standards and learning objectives by subject and grade level';
        END IF;
      END $$;
    `;

    // Execute table creation
    const { error: tableError } = await supabase.rpc('exec', { query: createTableSQL });
    if (tableError) {
      console.log('⚠️  Could not create table via RPC, trying direct approach...');
      // Try alternative approach - just proceed and see if table exists
    }

    // Get current academic year
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (yearError || !academicYear) {
      console.error('❌ No current academic year found');
      return;
    }

    console.log(`📚 Using academic year: ${academicYear.id}`);

    for (const standard of curriculumStandards) {
      // Get subject by code
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', standard.subject_code)
        .single();

      if (subjectError || !subject) {
        console.log(`⚠️  Subject ${standard.subject_code} not found, skipping...`);
        continue;
      }

      // Check if standard already exists
      const { data: existing, error: checkError } = await supabase
        .from('curriculum_standards')
        .select('id')
        .eq('subject_id', subject.id)
        .eq('grade_level', standard.grade_level)
        .eq('academic_year_id', academicYear.id)
        .eq('standard_code', standard.standard_code)
        .single();

      if (existing) {
        console.log(`⏭️  Standard ${standard.standard_code} already exists, skipping...`);
        continue;
      }

      // Insert curriculum standard
      const { error: insertError } = await supabase
        .from('curriculum_standards')
        .insert({
          subject_id: subject.id,
          grade_level: standard.grade_level,
          academic_year_id: academicYear.id,
          standard_code: standard.standard_code,
          title: standard.title,
          description: standard.description,
          learning_objectives: standard.learning_objectives,
          competencies: standard.competencies,
          assessment_criteria: standard.assessment_criteria
        });

      if (insertError) {
        console.error(`❌ Error inserting ${standard.standard_code}:`, insertError);
      } else {
        console.log(`✅ Inserted curriculum standard: ${standard.standard_code} - ${standard.title}`);
      }
    }

    console.log('🎉 Curriculum standards seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding curriculum standards:', error);
  }
}

// Run the seeding function
seedCurriculumStandards();