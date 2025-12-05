# 🎓 Vietnamese Học Bạ Feature - Quick Start Guide

## ✨ What's New?

A complete Vietnamese student transcript (Học bạ) system has been implemented with:
- ✅ **@react-pdf/renderer** for excellent Vietnamese font support
- ✅ **Interactive selectors** for year/semester filtering
- ✅ **Authentic Vietnamese Học bạ template**
- ✅ **PDF preview & download** functionality
- ✅ **Full API integration** with existing student/grade data

---

## 🚀 Quick Access

### For Teachers & Admins

**Option 1: From Student Progress Page**
1. Navigate to: `/dashboard/students/[student_id]/progress`
2. Click the **"📄 In học bạ"** button in the top right corner

**Option 2: Direct Access**
1. Go to: `/dashboard/students/[student_id]/transcript`

---

## 📋 How to Use

### Step-by-Step

1. **Select Academic Year**
   - Choose from the dropdown list
   - Current year is marked with "(Hiện tại)"

2. **Select Semester**
   - HK1 (Học kỳ 1) - First semester
   - HK2 (Học kỳ 2) - Second semester  
   - CN (Cả năm) - Whole year

3. **View Summary**
   - See GPA, conduct, attendance, and subject count at a glance

4. **Preview or Download**
   - Click **"👁 Xem trước PDF"** to preview in browser
   - Click **"📥 Tải xuống PDF"** to download

---

## 📊 What's Included in the Transcript?

### Student Information
- Full name (Họ và tên)
- Student ID (Mã số học sinh)
- Date of birth (Ngày sinh)
- Gender (Giới tính)
- Class (Lớp)

### Academic Performance
- **Grade Components** for each subject:
  - Miệng (Oral - weight 1)
  - 15 phút (15-min test - weight 1)
  - 1 tiết (45-min test - weight 2)
  - Giữa kỳ (Midterm - weight 2)
  - Cuối kỳ (Final - weight 3)
  - TB môn (Subject average)

### Summary Statistics
- **GPA** (Điểm trung bình chung)
- **Academic Classification** (Xếp loại học lực)
  - Xuất sắc (≥9.0), Giỏi (≥8.0), Khá (≥6.5), Trung bình (≥5.0), Yếu (<5.0)
- **Conduct** (Hạnh kiểm): Xuất sắc, Tốt, Trung bình, Yếu
- **Attendance Rate** (Chuyên cần): Percentage
- **Class Rank** (if available)

### Additional Information
- Teacher comments (Nhận xét)
- Homeroom teacher signature
- Principal signature
- Date of issue

---

## 🎨 PDF Features

- **Professional Layout**: Matches traditional Vietnamese Học bạ format
- **Vietnamese Fonts**: Full support for Vietnamese diacritics (à, ă, â, etc.)
- **Print-Ready**: A4 size, optimized for printing
- **Automatic Page Numbers**
- **School Branding**: Header with school name and address

---

## 🔧 Technical Details

### Files Created

```
web/
├── components/pdf/
│   └── HocBaTemplate.tsx          # PDF template component
├── app/
│   ├── dashboard/students/[id]/
│   │   ├── progress/page.tsx      # Updated with transcript button
│   │   └── transcript/page.tsx    # NEW: Main transcript page
│   └── api/students/[id]/
│       ├── route.ts               # NEW: Get single student
│       └── transcript/route.ts    # NEW: Transcript data API
└── docs/
    └── TRANSCRIPT_FEATURE.md      # Full documentation
```

### API Endpoints

**GET** `/api/students/[id]/transcript`
- Query params: `academic_year_id`, `semester`
- Returns: Formatted transcript data

**GET** `/api/students/[id]`
- Returns: Student basic information

### Dependencies Added
```json
{
  "@react-pdf/renderer": "^4.3.1"
}
```

---

## 🐛 Troubleshooting

### No Data Showing?
- **Check if student has grades** for the selected academic year/semester
- **Verify academic year is valid** and not empty
- Look for error messages in red banner

### PDF Not Generating?
- **Browser compatibility**: Works best in Chrome/Edge
- **Check console** for JavaScript errors
- Try **refreshing the page**

### Vietnamese Characters Look Wrong?
- Font may not be loading properly
- Check internet connection (fonts loaded from CDN)
- Try a different browser

### Grades Seem Incorrect?
- Verify grade data in the system
- Check that `component_type` values are correct in database
- Review weighted average calculation

---

## 📝 Notes

### Current Behavior
- School name defaults to "TRƯỜNG TRUNG HỌC PHỔ THÔNG BẮC HÀ"
- Principal name shows as "Hiệu trưởng" (can be customized)
- Homeroom teacher pulled from class enrollment data
- Conduct auto-calculated if not manually entered

### Data Requirements
For best results, ensure:
- ✅ Student has active enrollment in a class
- ✅ Grades exist for the selected semester
- ✅ Academic year is properly configured
- ✅ Grade component types are set correctly

---

## 🎯 Next Steps

### Suggested Enhancements
1. **Batch Processing**: Generate transcripts for entire class
2. **Email Integration**: Send transcripts to parents
3. **Multi-Year Reports**: Compare performance across years
4. **Custom Branding**: Add school logo and colors
5. **Digital Signatures**: QR code verification
6. **Export Options**: Excel, Word formats

---

## 📞 Support

For issues or questions:
- Check `/docs/TRANSCRIPT_FEATURE.md` for detailed documentation
- Review API responses in browser DevTools
- Verify database has required data

---

## ✅ Testing Checklist

Before using in production:
- [ ] Test with sample student that has complete grade data
- [ ] Verify all semester options (HK1, HK2, CN) work
- [ ] Check PDF preview displays correctly
- [ ] Confirm PDF download works
- [ ] Verify Vietnamese characters render properly
- [ ] Test with different academic years
- [ ] Check GPA calculations are accurate
- [ ] Ensure conduct grades appear correctly
- [ ] Validate attendance percentages
- [ ] Print PDF to verify page layout

---

**Status**: ✅ Ready to Use  
**Version**: 1.0  
**Last Updated**: December 2025
