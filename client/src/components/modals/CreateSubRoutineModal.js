import { useState } from 'react';
import { useRoutines } from '../../context/RoutinesContext';

const CreateSubRoutineModal = ({ onClose, parentRoutines }) => {
  const { addSubRoutine } = useRoutines();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Mindfulness',
    parentId: parentRoutines.length > 0 ? parentRoutines[0].id : '',
  });

  const categories = ['Mindfulness', 'Fitness', 'Prep', 'Learning', 'Social', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.parentId) {
      alert('Please select a parent routine');
      return;
    }

    addSubRoutine(formData.parentId, {
      title: formData.title,
      category: formData.category,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Sub-Routine</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Sub-Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubRoutineModal;

