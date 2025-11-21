import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';

const CreateParentRoutineModal = ({ onClose, parent }) => {
  const { addParentRoutine, updateParentRoutine } = useRoutines();
  const navigate = useNavigate();
  const isEditMode = !!parent;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: parent?.title || '',
    category: parent?.category || 'Wellness',
    description: parent?.description || '',
  });
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  useEffect(() => {
    if (parent) {
      setFormData({
        title: parent.title || '',
        category: parent.category || 'Wellness',
        description: parent.description || '',
      });
      const categories = ['Wellness', 'Productivity', 'Fitness', 'Learning', 'Social', 'Other'];
      setUseCustomCategory(!categories.includes(parent.category));
    }
  }, [parent]);

  const categories = ['Wellness', 'Productivity', 'Fitness', 'Learning', 'Social', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateParentRoutine(parent.id, {
          title: formData.title,
          category: formData.category,
          description: formData.description,
        });
        onClose();
      } else {
        const created = await addParentRoutine({
          title: formData.title,
          category: formData.category,
          description: formData.description,
        });
        onClose();
        navigate(`/sub-routines/${created.id}`);
      }
    } catch (err) {
      alert(err.message || `Failed to ${isEditMode ? 'update' : 'create'} routine`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Parent Routine' : 'Create Parent Routine'}</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Morning Mastery"
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

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your parent routine..."
              rows={3}
            />
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
                ? 'Update Parent Routine'
                : 'Create Parent Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateParentRoutineModal;

