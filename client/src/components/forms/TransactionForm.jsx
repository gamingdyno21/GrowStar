import React, { useState, useEffect } from 'react';
import { TRANSACTION_TYPES, TRANSACTION_CATEGORIES } from '../../utils/constants';

const TransactionForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'Expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Completed',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        amount: initialData.amount || '',
        type: initialData.type || 'Expense',
        category: initialData.category || 'Food',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        status: initialData.status || 'Completed',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear errors when writing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.title.trim()) tempErrors.title = 'Title is required';
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      tempErrors.amount = 'Amount must be a positive number';
    }
    if (!formData.category) tempErrors.category = 'Category is required';
    if (!formData.date) tempErrors.date = 'Date is required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade">
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="title" className="form-label">
            Transaction Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className={`form-control ${errors.title ? 'is-invalid' : ''}`}
            placeholder="e.g., Monthly Rent, Salary, Stock Purchase"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="amount" className="form-label">
            Amount (INR)
          </label>
          <div className="input-group">
            <span className="input-group-text bg-light">₹</span>
            <input
              type="number"
              id="amount"
              name="amount"
              step="any"
              className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
            />
            {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label htmlFor="type" className="form-label">
            Type
          </label>
          <select
            id="type"
            name="type"
            className="form-select"
            value={formData.type}
            onChange={handleChange}
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
          >
            {TRANSACTION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="date" className="form-label">
            Transaction Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            className={`form-control ${errors.date ? 'is-invalid' : ''}`}
            value={formData.date}
            onChange={handleChange}
          />
          {errors.date && <div className="invalid-feedback">{errors.date}</div>}
        </div>
      </div>

      <div className="row">
        <div className="col-md-8 mb-3">
          <label htmlFor="description" className="form-label">
            Description / Notes
          </label>
          <textarea
            id="description"
            name="description"
            rows="2"
            className="form-control"
            placeholder="Add details about this transaction..."
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="form-select"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary px-4">
          {initialData ? 'Save Changes' : 'Add Record'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
