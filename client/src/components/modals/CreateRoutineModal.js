import { useState } from 'react';
import { useRoutines } from '../../context/RoutinesContext';

const CreateRoutineModal = ({ onClose, parentId, subId }) => {
  const { addRoutine, parentRoutines } = useRoutines();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const parent = parentRoutines.find((p) => p.id === parentId);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [formData, setFormData] = useState({
    selectedSubId: subId || (parent?.subRoutines.length > 0 ? parent.subRoutines[0].id : ''),
    title: '',
    description: '',
    category: 'General',
    type: 'yes_no',
    target: 0,
    unit: '',
    min: 0,
    max: 10,
  });

  const inputTypes = [
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'slider', label: 'Slider' },
  ];

  const categories = ['General', 'Health', 'Fitness', 'Learning', 'Productivity', 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    const targetSubId = subId || formData.selectedSubId;
    if (!parentId || !targetSubId) {
      alert('Missing parent or sub-routine information');
      return;
    }

    const routineData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      type: formData.type,
    };

    if (formData.type === 'quantity') {
      routineData.target = parseInt(formData.target) || 0;
      routineData.unit = formData.unit;
    } else if (formData.type === 'slider') {
      routineData.min = parseInt(formData.min) || 0;
      routineData.max = parseInt(formData.max) || 10;
    }

    setIsSubmitting(true);
    try {
      await addRoutine(parentId, targetSubId, routineData);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to create routine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Routine</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!subId && parent && parent.subRoutines.length > 0 && (
            <div className="form-group">
              <label>Sub-Routine *</label>
              <select
                value={formData.selectedSubId}
                onChange={(e) => setFormData({ ...formData, selectedSubId: e.target.value })}
                required
              >
                <option value="">Select a sub-routine</option>
                {parent.subRoutines.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.title}
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
              placeholder="e.g., Meditation"
              required
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your routine..."
              rows={3}
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
            <label>Input Method *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              {inputTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.type === 'quantity' && (
            <>
              <div className="form-group">
                <label>Target Quantity *</label>
                <input
                  type="number"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unit (Optional)</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., ml, reps, minutes"
                />
              </div>
            </>
          )}

          {formData.type === 'slider' && (
            <>
              <div className="form-group">
                <label>Minimum Value *</label>
                <input
                  type="number"
                  value={formData.min}
                  onChange={(e) => setFormData({ ...formData, min: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maximum Value *</label>
                <input
                  type="number"
                  value={formData.max}
                  onChange={(e) => setFormData({ ...formData, max: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Routine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoutineModal;

