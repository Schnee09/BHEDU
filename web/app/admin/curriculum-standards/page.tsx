'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { TabsComponent as Tabs, TabsContentComponent as TabsContent, TabsListComponent as TabsList, TabsTriggerComponent as TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, TagIcon, TrophyIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface AcademicYear {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  is_current: boolean;
}

interface CurriculumStandard {
  id: string;
  subject_id: string;
  grade_level: string;
  academic_year_id: string;
  standard_code: string;
  title: string;
  description?: string;
  learning_objectives: string[];
  competencies: string[];
  assessment_criteria: string[];
  subjects: Subject;
  academic_years: AcademicYear;
}

export default function CurriculumStandardsPage() {
  const [standards, setStandards] = useState<CurriculumStandard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<CurriculumStandard | null>(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    grade_level: '',
    academic_year_id: '',
    standard_code: '',
    title: '',
    description: '',
    learning_objectives: [''],
    competencies: [''],
    assessment_criteria: ['']
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load curriculum standards
      const standardsResponse = await fetch('/api/curriculum-standards');
      if (standardsResponse.ok) {
        const standardsData = await standardsResponse.json();
        setStandards(standardsData.standards || []);
      }

      // Load subjects
      const subjectsResponse = await fetch('/api/subjects');
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }

      // Load academic years
      const yearsResponse = await fetch('/api/academic-years');
      if (yearsResponse.ok) {
        const yearsData = await yearsResponse.json();
        setAcademicYears(yearsData.years || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      grade_level: '',
      academic_year_id: '',
      standard_code: '',
      title: '',
      description: '',
      learning_objectives: [''],
      competencies: [''],
      assessment_criteria: ['']
    });
  };

  const handleCreate = async () => {
    try {
      // Get current academic year if not selected
      let academicYearId = formData.academic_year_id;
      if (!academicYearId) {
        const currentYear = academicYears.find((year: AcademicYear) => year.is_current);
        if (currentYear) {
          academicYearId = currentYear.id;
        }
      }

      const response = await fetch('/api/curriculum-standards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          academic_year_id: academicYearId,
          learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
          competencies: formData.competencies.filter(comp => comp.trim()),
          assessment_criteria: formData.assessment_criteria.filter(crit => crit.trim())
        }),
      });

      if (response.ok) {
        toast.success('Tạo chuẩn chương trình thành công');
        setIsCreateDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không thể tạo chuẩn chương trình');
      }
    } catch (error) {
      console.error('Error creating curriculum standard:', error);
      toast.error('Lỗi khi tạo chuẩn chương trình');
    }
  };

  const handleEdit = async () => {
    if (!editingStandard) return;

    try {
      const response = await fetch(`/api/curriculum-standards/${editingStandard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          learning_objectives: formData.learning_objectives.filter(obj => obj.trim()),
          competencies: formData.competencies.filter(comp => comp.trim()),
          assessment_criteria: formData.assessment_criteria.filter(crit => crit.trim())
        }),
      });

      if (response.ok) {
        toast.success('Cập nhật chuẩn chương trình thành công');
        setIsEditDialogOpen(false);
        setEditingStandard(null);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không thể cập nhật chuẩn chương trình');
      }
    } catch (error) {
      console.error('Error updating curriculum standard:', error);
      toast.error('Lỗi khi cập nhật chuẩn chương trình');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/curriculum-standards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Xóa chuẩn chương trình thành công');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Không thể xóa chuẩn chương trình');
      }
    } catch (error) {
      console.error('Error deleting curriculum standard:', error);
      toast.error('Lỗi khi xóa chuẩn chương trình');
    }
  };

  const openEditDialog = (standard: CurriculumStandard) => {
    setEditingStandard(standard);
    setFormData({
      subject_id: standard.subject_id,
      grade_level: standard.grade_level,
      academic_year_id: standard.academic_year_id,
      standard_code: standard.standard_code,
      title: standard.title,
      description: standard.description || '',
      learning_objectives: standard.learning_objectives.length > 0 ? standard.learning_objectives : [''],
      competencies: standard.competencies.length > 0 ? standard.competencies : [''],
      assessment_criteria: standard.assessment_criteria.length > 0 ? standard.assessment_criteria : ['']
    });
    setIsEditDialogOpen(true);
  };

  const addArrayItem = (field: 'learning_objectives' | 'competencies' | 'assessment_criteria') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayItem = (field: 'learning_objectives' | 'competencies' | 'assessment_criteria', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayItem = (field: 'learning_objectives' | 'competencies' | 'assessment_criteria', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Filter standards based on search and filters
  const filteredStandards = standards.filter(standard => {
    const matchesSearch = standard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         standard.standard_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         standard.subjects.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'all' || standard.grade_level === selectedGrade;
    const matchesSubject = selectedSubject === 'all' || standard.subject_id === selectedSubject;

    return matchesSearch && matchesGrade && matchesSubject;
  });

  const gradeLevels = ['10', '11', '12'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý chuẩn chương trình</h1>
          <p className="text-muted-foreground">
            Quản lý các chuẩn chương trình học và mục tiêu học tập theo chương trình Việt Nam
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger>
            <Button onClick={resetForm}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm chuẩn mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo chuẩn chương trình mới</DialogTitle>
              <DialogDescription>
                Thêm mới một chuẩn chương trình học với mục tiêu và yêu cầu cụ thể
              </DialogDescription>
            </DialogHeader>
            <CurriculumStandardForm
              formData={formData}
              setFormData={setFormData}
              subjects={subjects}
              academicYears={academicYears}
              gradeLevels={gradeLevels}
              onAddItem={addArrayItem}
              onUpdateItem={updateArrayItem}
              onRemoveItem={removeArrayItem}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreate}>
                Tạo chuẩn
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tìm theo tên, mã chuẩn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grade">Khối lớp</Label>
              <Select id="grade" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                <option value="all">Tất cả khối</option>
                {gradeLevels.map(grade => (
                  <option key={grade} value={grade}>Khối {grade}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="subject">Môn học</Label>
              <Select id="subject" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="all">Tất cả môn</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('all');
                  setSelectedSubject('all');
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStandards.map(standard => (
          <Card key={standard.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{standard.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="default">{standard.standard_code}</Badge>
                    <Badge variant="info">Khối {standard.grade_level}</Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(standard)}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button variant="ghost" size="sm">
                        <TrashIcon className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa chuẩn chương trình "{standard.title}"?
                          Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(standard.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Môn học</p>
                  <p className="text-sm">{standard.subjects.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Năm học</p>
                  <p className="text-sm">{standard.academic_years.name}</p>
                </div>
                {standard.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
                    <p className="text-sm">{standard.description}</p>
                  </div>
                )}

                <Tabs defaultValue="objectives" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="objectives" className="text-xs">
                      <TagIcon className="w-3 h-3 mr-1" />
                      Mục tiêu
                    </TabsTrigger>
                    <TabsTrigger value="competencies" className="text-xs">
                      <TrophyIcon className="w-3 h-3 mr-1" />
                      Năng lực
                    </TabsTrigger>
                    <TabsTrigger value="criteria" className="text-xs">
                      <BookOpenIcon className="w-3 h-3 mr-1" />
                      Tiêu chí
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="objectives" className="mt-2">
                    <ul className="text-xs space-y-1">
                      {standard.learning_objectives.slice(0, 3).map((objective, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                      {standard.learning_objectives.length > 3 && (
                        <li className="text-muted-foreground text-xs">
                          +{standard.learning_objectives.length - 3} mục tiêu khác...
                        </li>
                      )}
                    </ul>
                  </TabsContent>
                  <TabsContent value="competencies" className="mt-2">
                    <ul className="text-xs space-y-1">
                      {standard.competencies.slice(0, 3).map((competency, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{competency}</span>
                        </li>
                      ))}
                      {standard.competencies.length > 3 && (
                        <li className="text-muted-foreground text-xs">
                          +{standard.competencies.length - 3} năng lực khác...
                        </li>
                      )}
                    </ul>
                  </TabsContent>
                  <TabsContent value="criteria" className="mt-2">
                    <ul className="text-xs space-y-1">
                      {standard.assessment_criteria.slice(0, 3).map((criteria, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span>{criteria}</span>
                        </li>
                      ))}
                      {standard.assessment_criteria.length > 3 && (
                        <li className="text-muted-foreground text-xs">
                          +{standard.assessment_criteria.length - 3} tiêu chí khác...
                        </li>
                      )}
                    </ul>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStandards.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpenIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy chuẩn chương trình</h3>
            <p className="text-muted-foreground text-center">
              {standards.length === 0
                ? 'Chưa có chuẩn chương trình nào được tạo. Hãy thêm chuẩn đầu tiên!'
                : 'Không có chuẩn chương trình nào phù hợp với bộ lọc hiện tại.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chuẩn chương trình</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chuẩn chương trình học
            </DialogDescription>
          </DialogHeader>
          <CurriculumStandardForm
            formData={formData}
            setFormData={setFormData}
            subjects={subjects}
            academicYears={academicYears}
            gradeLevels={gradeLevels}
            onAddItem={addArrayItem}
            onUpdateItem={updateArrayItem}
            onRemoveItem={removeArrayItem}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEdit}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Form component for curriculum standards
interface CurriculumStandardFormProps {
  formData: any;
  setFormData: (data: any) => void;
  subjects: Subject[];
  academicYears: AcademicYear[];
  gradeLevels: string[];
  onAddItem: (field: 'learning_objectives' | 'competencies' | 'assessment_criteria') => void;
  onUpdateItem: (field: 'learning_objectives' | 'competencies' | 'assessment_criteria', index: number, value: string) => void;
  onRemoveItem: (field: 'learning_objectives' | 'competencies' | 'assessment_criteria', index: number) => void;
}

function CurriculumStandardForm({
  formData,
  setFormData,
  subjects,
  academicYears,
  gradeLevels,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: CurriculumStandardFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="subject_id">Môn học *</Label>
          <Select
            id="subject_id"
            value={formData.subject_id}
            onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
          >
            <option value="">Chọn môn học</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="grade_level">Khối lớp *</Label>
          <Select
            id="grade_level"
            value={formData.grade_level}
            onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
          >
            <option value="">Chọn khối lớp</option>
            {gradeLevels.map(grade => (
              <option key={grade} value={grade}>Khối {grade}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="standard_code">Mã chuẩn *</Label>
          <Input
            id="standard_code"
            value={formData.standard_code}
            onChange={(e) => setFormData({ ...formData, standard_code: e.target.value })}
            placeholder="Ví dụ: MATH-10-1"
          />
        </div>
        <div>
          <Label htmlFor="academic_year_id">Năm học</Label>
          <Select
            id="academic_year_id"
            value={formData.academic_year_id}
            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
          >
            <option value="">Chọn năm học</option>
            {academicYears.map(year => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="title">Tiêu đề *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ví dụ: Hàm số và giới hạn"
        />
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả chi tiết về chuẩn chương trình..."
          rows={3}
        />
      </div>

      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives">Mục tiêu học tập</TabsTrigger>
          <TabsTrigger value="competencies">Năng lực</TabsTrigger>
          <TabsTrigger value="criteria">Tiêu chí đánh giá</TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mục tiêu học tập</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddItem('learning_objectives')}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm mục tiêu
            </Button>
          </div>
          {formData.learning_objectives.map((objective: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={objective}
                onChange={(e) => onUpdateItem('learning_objectives', index, e.target.value)}
                placeholder={`Mục tiêu ${index + 1}`}
              />
              {formData.learning_objectives.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem('learning_objectives', index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Năng lực cần đạt</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddItem('competencies')}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm năng lực
            </Button>
          </div>
          {formData.competencies.map((competency: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={competency}
                onChange={(e) => onUpdateItem('competencies', index, e.target.value)}
                placeholder={`Năng lực ${index + 1}`}
              />
              {formData.competencies.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem('competencies', index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Tiêu chí đánh giá</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddItem('assessment_criteria')}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Thêm tiêu chí
            </Button>
          </div>
          {formData.assessment_criteria.map((criteria: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={criteria}
                onChange={(e) => onUpdateItem('assessment_criteria', index, e.target.value)}
                placeholder={`Tiêu chí ${index + 1}`}
              />
              {formData.assessment_criteria.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem('assessment_criteria', index)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}