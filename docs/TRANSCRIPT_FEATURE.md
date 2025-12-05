# Vietnamese Học Bạ (Student Transcript) Feature

## Overview
A comprehensive Vietnamese student transcript (Học bạ) generation system using `@react-pdf/renderer` with full Vietnamese language support.

## 🎯 Features

### ✅ Implemented
- **@react-pdf/renderer Integration**: Better Vietnamese font support than jsPDF
- **Interactive Selectors**: Choose student, academic year, and semester
- **Vietnamese Học Bạ Template**: Authentic Vietnamese transcript format
- **API Integration**: Seamlessly connects with existing student/grade APIs
- **PDF Preview**: In-browser preview before download
- **PDF Download**: Generate and download PDF transcripts
- **Component Grade Display**: Shows all grade components (miệng, 15 phút, 1 tiết, giữa kỳ, cuối kỳ)
- **GPA Calculation**: Vietnamese weighted average system
- **Conduct & Attendance**: Includes behavioral grades and attendance rates

## 📁 File Structure

```
web/
├── components/pdf/
│   └── HocBaTemplate.tsx          # PDF template component
├── app/
│   ├── dashboard/students/[id]/
│   │   ├── progress/page.tsx      # Updated with transcript link
│   │   └── transcript/page.tsx    # Main transcript page
│   └── api/students/[id]/
│       ├── route.ts               # Get single student
│       └── transcript/route.ts    # Transcript data API
```

## 🚀 Usage

### Access the Transcript Page

1. Navigate to any student's progress page:
   ```
   /dashboard/students/[student_id]/progress
   ```

2. Click the **"📄 In học bạ"** button in the top right

3. Select academic year and semester from the dropdowns

4. Preview or download the PDF transcript

### Direct URL Access
```
/dashboard/students/[student_id]/transcript
```

## 📊 API Endpoints

### GET `/api/students/[id]/transcript`

Fetches consolidated transcript data for PDF generation.

**Query Parameters:**
- `academic_year_id` (required): UUID of the academic year
- `semester` (required): 'HK1', 'HK2', or 'CN' (whole year)

**Response:**
```json
{
  "success": true,
  "data": {
    "school_name": "TRƯỜNG TRUNG HỌC PHỔ THÔNG BẮC HÀ",
    "student_name": "Nguyễn Văn A",
    "student_code": "HS001",
    "date_of_birth": "01/01/2008",
    "gender": "Nam",
    "class_name": "10A1",
    "grade_level": "Lớp 10",
    "academic_year": "2024-2025",
    "semester": "Học kỳ 1",
    "subjects": [
      {
        "subject_name": "Toán học",
        "subject_code": "MATH",
        "final_grade": 8.5,
        "component_grades": {
          "oral": 8.0,
          "fifteen_min": 8.5,
          "one_period": 8.3,
          "midterm": 8.7,
          "final": 8.8
        }
      }
    ],
    "gpa": 8.2,
    "conduct": "Tốt",
    "attendance_rate": 95.5,
    "teacher_comment": "Học sinh chăm chỉ...",
    "homeroom_teacher": "Cô Nguyễn Thị B",
    "principal_name": "Hiệu trưởng"
  }
}
```

## 🎨 PDF Template Features

### Vietnamese Học Bạ Format
- **Header**: School name, address, title
- **Student Info**: Name, ID, DOB, gender, class
- **Grade Table**: 
  - STT (Number)
  - Môn học (Subject)
  - Miệng (Oral - weight 1)
  - 15 phút (15-min test - weight 1)
  - 1 tiết (45-min test - weight 2)
  - Giữa kỳ (Midterm - weight 2)
  - Cuối kỳ (Final - weight 3)
  - TB môn (Subject average)
- **Summary Box**:
  - Điểm trung bình chung (GPA)
  - Xếp loại học lực (Classification)
  - Hạnh kiểm (Conduct)
  - Chuyên cần (Attendance)
  - Xếp hạng lớp (Class rank - optional)
- **Teacher Comments**
- **Signatures**: Homeroom teacher and Principal

### Font Support
Uses Roboto font family with Vietnamese character support via CDN:
- Light (300)
- Regular (400)
- Medium (500)
- Bold (700)

## 🔧 Technical Details

### Grade Calculation (Vietnamese System)

The weighted average formula:
```
GPA = (Miệng×1 + 15phút×1 + 1tiết×2 + Giữakỳ×2 + Cuốikỳ×3) / total_weight
```

### Grade Classifications
- **Xuất sắc** (Excellent): GPA ≥ 9.0
- **Giỏi** (Good): GPA ≥ 8.0
- **Khá** (Fair): GPA ≥ 6.5
- **Trung bình** (Average): GPA ≥ 5.0
- **Yếu** (Weak): GPA < 5.0

### Conduct Determination
Auto-calculated based on:
- Attendance rate
- GPA
- Manual conduct grades (if available)

Logic:
- **Xuất sắc**: GPA ≥ 8.0 AND Attendance ≥ 95%
- **Tốt**: GPA ≥ 6.5 AND Attendance ≥ 90%
- **Trung bình**: GPA ≥ 5.0 OR Attendance ≥ 80%
- **Yếu**: Otherwise

## 🛠️ Development

### Testing the Feature

1. **Start the development server:**
   ```bash
   cd web
   pnpm dev
   ```

2. **Navigate to a student's transcript page:**
   ```
   http://localhost:3000/dashboard/students/[student_id]/transcript
   ```

3. **Test scenarios:**
   - Select different academic years
   - Switch between semesters (HK1, HK2, CN)
   - Preview PDF in browser
   - Download PDF file
   - Verify Vietnamese characters render correctly
   - Check grade calculations

### Adding Component Types

To add new grade component types, update:

1. **Database**: Add to `grade_component_configs` table
2. **API**: Update grouping logic in `/api/students/[id]/transcript/route.ts`
3. **Template**: Add column to table in `HocBaTemplate.tsx`

## 📝 Notes

### Current Limitations
- School name/address are hardcoded (can be moved to settings)
- Principal name is placeholder
- Class ranking calculation not yet implemented
- Single-page PDF only (multi-year reports would need pagination)

### Future Enhancements
- [ ] Multi-semester/multi-year reports
- [ ] Custom school branding (logo, colors)
- [ ] Export to Excel format
- [ ] Batch PDF generation for entire class
- [ ] Email transcript to parents
- [ ] Digital signatures
- [ ] QR code verification
- [ ] Graphical performance charts in PDF

## 🔐 Security

- All endpoints protected by `teacherAuth`
- Only teachers and admins can generate transcripts
- Students can only view their own transcripts (future enhancement)

## 📚 Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.1"
}
```

## 📖 Related Documentation

- [Vietnamese Grade System](../../supabase/migrations_archived/20251119_vietnamese_grade_system.sql)
- [Student Progress API](../../app/api/students/[id]/progress/route.ts)
- [Grade Service](../../lib/gradeService.ts)

## 🎯 Success Criteria

- ✅ PDF generates with correct Vietnamese characters
- ✅ All grade components display correctly
- ✅ GPA calculations match Vietnamese system
- ✅ PDF format matches traditional Học bạ layout
- ✅ Selectors work for year/semester filtering
- ✅ Preview and download functions work
- ✅ Integrated into student progress workflow

## 🐛 Troubleshooting

### PDF Not Generating
- Check browser console for errors
- Verify student has grades for selected period
- Ensure academic year ID is valid

### Vietnamese Characters Display as Boxes
- Font CDN may be blocked
- Consider hosting Roboto fonts locally

### Wrong Grade Calculations
- Verify component_type values in database
- Check grade_component_configs table
- Review API grouping logic

---

**Created**: December 2025  
**Status**: ✅ Production Ready  
**Maintainer**: Development Team
