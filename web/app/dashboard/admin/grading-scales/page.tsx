'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';

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
  { letter: 'A', min: 90, max: 100, gpa: 4.0 },
  { letter: 'B', min: 80, max: 89, gpa: 3.0 },
  { letter: 'C', min: 70, max: 79, gpa: 2.0 },
  { letter: 'D', min: 60, max: 69, gpa: 1.0 },
  { letter: 'F', min: 0, max: 59, gpa: 0.0 },
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
      alert('Failed to fetch grading scales');
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to save grading scale';
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
        throw new Error(error.error || 'Failed to delete');
      }
      fetchScales();
    } catch (error) {
      console.error('Error deleting grading scale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete grading scale';
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
        throw new Error(error.error || 'Failed to set default');
      }
      fetchScales();
    } catch (error) {
      console.error('Error setting default scale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to set default scale';
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Grading Scales</h1>
          <p className="text-gray-600">Manage grade boundaries and GPA calculations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingScale(null);
            setFormData({ name: '', description: '', is_default: false, scale: DEFAULT_SCALE });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Grading Scale
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search grading scales..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl m-4">
            <h2 className="text-xl font-bold mb-4">
              {editingScale ? 'Edit Grading Scale' : 'Add Grading Scale'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Scale Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Standard 10-Point Scale"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Optional description of this grading scale"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Set as default grading scale</label>
              </div>

              {/* Grade Boundaries Editor */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">Grade Boundaries *</label>
                  <button
                    type="button"
                    onClick={addGradeEntry}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Grade
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.scale.map((grade, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded">
                      <input
                        type="text"
                        placeholder="Letter"
                        value={grade.letter}
                        onChange={(e) => updateGradeEntry(index, 'letter', e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Min %"
                        value={grade.min}
                        onChange={(e) => updateGradeEntry(index, 'min', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border rounded"
                        min="0"
                        max="100"
                        required
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        placeholder="Max %"
                        value={grade.max}
                        onChange={(e) => updateGradeEntry(index, 'max', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border rounded"
                        min="0"
                        max="100"
                        required
                      />
                      <input
                        type="number"
                        placeholder="GPA"
                        value={grade.gpa || 0}
                        onChange={(e) => updateGradeEntry(index, 'gpa', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 border rounded"
                        step="0.1"
                        min="0"
                        max="4.0"
                      />
                      <button
                        type="button"
                        onClick={() => removeGradeEntry(index)}
                        className="text-red-600 hover:text-red-800 ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingScale ? 'Update Scale' : 'Create Scale'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingScale(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scales List */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : filteredScales.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No grading scales found. Create your first grading scale to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredScales.map((scale) => (
            <div key={scale.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{scale.name}</h3>
                    {scale.is_default && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Default
                      </span>
                    )}
                  </div>
                  {scale.description && (
                    <p className="text-sm text-gray-600 mt-1">{scale.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!scale.is_default && (
                    <button
                      onClick={() => handleSetDefault(scale.id)}
                      className="text-sm text-green-600 hover:text-green-900"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(scale)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(scale.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Grade Scale Display */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {scale.scale.map((grade, index) => (
                  <div key={index} className="border rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{grade.letter}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {grade.min}% - {grade.max}%
                    </div>
                    {grade.gpa !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">GPA: {grade.gpa.toFixed(1)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
