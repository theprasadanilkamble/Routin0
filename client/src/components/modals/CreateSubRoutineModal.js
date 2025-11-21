import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';

const CreateSubRoutineModal = ({ onClose, parentRoutines, subRoutine }) => {
  const { addSubRoutine, updateSubRoutine } = useRoutines();
  const navigate = useNavigate();
  const isEditMode = !!subRoutine;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: subRoutine?.title || '',
    category: subRoutine?.category || 'Mindfulness',
    parentId: subRoutine ? (parentRoutines.find(p => p.subRoutines?.some(s => s.id === subRoutine.id))?.id || parentRoutines[0]?.id) : (parentRoutines.length > 0 ? parentRoutines[0].id : ''),
  });
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  useEffect(() => {
    if (subRoutine) {
      setFormData({
        title: subRoutine.title || '',
        category: subRoutine.category || 'Mindfulness',
        parentId: parentRoutines.find(p => p.subRoutines?.some(s => s.id === subRoutine.id))?.id || parentRoutines[0]?.id || '',
      });
      const categories = ['Mindfulness', 'Fitness', 'Prep', 'Learning', 'Social', 'Other'];
      setUseCustomCategory(!categories.includes(subRoutine.category));
    }
  }, [subRoutine, parentRoutines]);

  const categories = ['Mindfulness', 'Fitness', 'Prep', 'Learning', 'Social', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.parentId) {
      alert('Please select a parent routine');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateSubRoutine(formData.parentId, subRoutine.id, {
          title: formData.title,
          category: formData.category,
        });
        onClose();
      } else {
        const created = await addSubRoutine(formData.parentId, {
          title: formData.title,
          category: formData.category,
        });
        onClose();
        navigate(`/routines/${formData.parentId}/${created.id}`);
      }
    } catch (err) {
      alert(err.message || `Failed to ${isEditMode ? 'update' : 'create'} sub routine`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Sub-Routine' : 'Create Sub-Routine'}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!isEditMode && (
            <div className="form-group">
              <label>Parent Routine *</label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                required
              >
                <option value="">Select a parent routine</option>
                {parentRoutines.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mindful Start"
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={useCustomCategory ? 'custom' : formData.category}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomCategory(true);
                  setFormData({ ...formData, category: '' });
                } else {
                  setUseCustomCategory(false);
                  setFormData({ ...formData, category: e.target.value });
                }
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">Custom…</option>
            </select>
            {useCustomCategory && (
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Enter custom category"
                required
              />
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating…'
                  : 'Creating…'
                : isEditMode
                ? 'Update Sub-Routine'
                : 'Create Sub-Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubRoutineModal;

