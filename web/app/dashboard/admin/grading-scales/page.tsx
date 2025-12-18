'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Icons } from "@/components/ui/Icons";

interface GradeEntry {
  letter: string;
  min: number;
  max: number;
  gpa?: number;
}

interface GradingScale {
  id: string;
  name: string;
  description: string;
  scale: GradeEntry[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SCALE: GradeEntry[] = [
  { letter: 'A+', min: 9.5, max: 10.0, gpa: 4.0 },
  { letter: 'A', min: 8.5, max: 9.4, gpa: 3.7 },
  { letter: 'B+', min: 7.0, max: 8.4, gpa: 3.0 },
  { letter: 'B', min: 5.0, max: 6.9, gpa: 2.0 },
  { letter: 'C', min: 0.0, max: 4.9, gpa: 1.0 },
];

const VIETNAMESE_SCALE: GradeEntry[] = [
  { letter: 'XS', min: 9.5, max: 10.0, gpa: 4.0 }, // Xuất sắc
  { letter: 'G', min: 8.5, max: 9.4, gpa: 3.7 },   // Giỏi
  { letter: 'K', min: 7.0, max: 8.4, gpa: 3.0 },   // Khá
  { letter: 'TB', min: 5.0, max: 6.9, gpa: 2.0 },  // Trung bình
  { letter: 'Y', min: 0.0, max: 4.9, gpa: 1.0 },   // Yếu
];

export default function GradingScalesPage() {
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    scale: DEFAULT_SCALE,
  });

  useEffect(() => {
    fetchScales();
  }, []);

  const fetchScales = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/admin/grading-scales');
      const data = await response.json();
      setScales(data.data || data);
    } catch (error) {
      console.error('Error fetching grading scales:', error);
      alert('Không thể tải thang điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate scale
    const sortedScale = [...formData.scale].sort((a, b) => b.min - a.min);
    
    try {
      if (editingScale) {
        const response = await apiFetch(`/api/admin/grading-scales/${editingScale.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ ...formData, scale: sortedScale }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update');
        }
      } else {
        const response = await apiFetch('/api/admin/grading-scales', {
          method: 'POST',
          body: JSON.stringify({ ...formData, scale: sortedScale }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create');
        }
      }

      setShowForm(false);
      setEditingScale(null);
      setFormData({ name: '', description: '', is_default: false, scale: DEFAULT_SCALE });
      fetchScales();
    } catch (error) {
      console.error('Error saving grading scale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể lưu thang điểm';
      alert(errorMessage);
    }
  };

  const handleEdit = (scale: GradingScale) => {
    setEditingScale(scale);
    setFormData({
      name: scale.name,
      description: scale.description || '',
      is_default: scale.is_default,
      scale: scale.scale,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grading scale?')) return;

    try {
      const response = await apiFetch(`/api/admin/grading-scales/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể xóa');
      }
      fetchScales();
    } catch (error) {
      console.error('Error deleting grading scale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa thang điểm';
      alert(errorMessage);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await apiFetch(`/api/admin/grading-scales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_default: true }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể đặt mặc định');
      }
      fetchScales();
    } catch (error) {
      console.error('Error setting default scale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể đặt thang điểm mặc định';
      alert(errorMessage);
    }
  };

  const updateGradeEntry = (index: number, field: keyof GradeEntry, value: string | number) => {
    const newScale = [...formData.scale];
    newScale[index] = { ...newScale[index], [field]: value };
    setFormData({ ...formData, scale: newScale });
  };

  const addGradeEntry = () => {
    setFormData({
      ...formData,
      scale: [...formData.scale, { letter: '', min: 0, max: 0, gpa: 0 }],
    });
  };

  const removeGradeEntry = (index: number) => {
    setFormData({
      ...formData,
      scale: formData.scale.filter((_, i) => i !== index),
    });
  };

  const filteredScales = scales.filter((scale) =>
    scale.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Icons.Grades className="w-8 h-8 text-blue-600" />
            Grading Scales
          </h1>
          <p className="text-gray-500 mt-1">Manage grade boundaries and GPA calculations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingScale(null);
            setFormData({ name: '', description: '', is_default: false, scale: DEFAULT_SCALE });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icons.Add className="w-5 h-5" />
          Add Grading Scale
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icons.Filter className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search grading scales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <Card className="w-full max-w-3xl">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingScale ? 'Edit Grading Scale' : 'Add Grading Scale'}
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scale Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Standard 10-Point Scale"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Scales</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scale: VIETNAMESE_SCALE, name: formData.name || 'Vietnamese Scale' })}
                      className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900">Vietnamese Scale</div>
                      <div className="text-sm text-gray-600">Xuất sắc (9.5-10.0), Giỏi (8.5-9.4), Khá (7.0-8.4), etc.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scale: DEFAULT_SCALE, name: formData.name || 'Standard Scale' })}
                      className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="font-medium text-gray-900">Standard Scale</div>
                      <div className="text-sm text-gray-600">A+ (90-100), A (80-89), B (70-79), etc.</div>
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Set as default grading scale</span>
                  </label>
                </div>

                {/* Grade Boundaries Editor */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Grade Boundaries *</label>
                    <button
                      type="button"
                      onClick={addGradeEntry}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                    >
                      <Icons.Add className="w-4 h-4" />
                      Add Grade
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Array.isArray(formData.scale) && formData.scale.map((grade, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <input
                          type="text"
                          placeholder="Letter"
                          value={grade.letter}
                          onChange={(e) => updateGradeEntry(index, 'letter', e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min %"
                            value={grade.min}
                            onChange={(e) => updateGradeEntry(index, 'min', parseFloat(e.target.value))}
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            min="0"
                            max="100"
                            required
                          />
                          <span className="text-gray-500 text-sm">to</span>
                          <input
                            type="number"
                            placeholder="Max %"
                            value={grade.max}
                            onChange={(e) => updateGradeEntry(index, 'max', parseFloat(e.target.value))}
                            className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            min="0"
                            max="100"
                            required
                          />
                        </div>
                        <input
                          type="number"
                          placeholder="GPA"
                          value={grade.gpa || 0}
                          onChange={(e) => updateGradeEntry(index, 'gpa', parseFloat(e.target.value))}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                          step="0.1"
                          min="0"
                          max="4.0"
                        />
                        <button
                          type="button"
                          onClick={() => removeGradeEntry(index)}
                          className="text-red-600 hover:text-red-800 ml-auto p-1 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <Icons.Delete className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingScale(null);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingScale ? 'Update Scale' : 'Create Scale'}
                  </button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Scales List */}
      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading...</div>
      ) : filteredScales.length === 0 ? (
        <div className="text-center py-12 text-stone-500 bg-white rounded-xl border border-stone-200">
          <Icons.Grades className="w-12 h-12 mx-auto mb-3 text-stone-400" />
          <p>No grading scales found. Create your first grading scale to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredScales.map((scale) => (
            <Card key={scale.id}>
              <CardBody>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{scale.name}</h3>
                      {scale.is_default && (
                        <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                          <Icons.Success className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    {scale.description && (
                      <p className="text-sm text-stone-500 mt-1">{scale.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!scale.is_default && (
                      <button
                        onClick={() => handleSetDefault(scale.id)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1.5 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(scale)}
                      className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Icons.Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(scale.id)}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Icons.Delete className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Grade Scale Display */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Array.isArray(scale.scale) && scale.scale.map((grade, index) => (
                    <div key={index} className="border border-stone-200 rounded-lg p-4 text-center bg-stone-50/50">
                      <div className="text-2xl font-bold text-stone-900">{grade.letter}</div>
                      <div className="text-sm text-stone-600 mt-1 font-medium">
                        {grade.min}% - {grade.max}%
                      </div>
                      {grade.gpa !== undefined && (
                        <div className="text-xs text-stone-500 mt-1">GPA: {grade.gpa.toFixed(1)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
