import React, { useState } from 'react';
import api from '../../services/api';
import './CreateStoryModal.css';

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to share.');
      return;
    }
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setError(err.response?.data?.message || 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="create-story-overlay" onClick={onClose}>
      <div className="create-story-content" onClick={(e) => e.stopPropagation()}>
        <div className="create-story-header">
          <h3>Create Story</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="create-story-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-story-form">
          <div className="preview-container">
            {preview ? (
              <img src={preview} alt="Story Preview" className="story-preview-img" />
            ) : (
              <div className="upload-placeholder">
                <span>📸 Select an image for your 24h story</span>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            id="story-file-input"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div className="create-story-actions">
            <label htmlFor="story-file-input" className="select-file-btn">
              {file ? 'Change Photo' : 'Choose Photo'}
            </label>
            <button
              type="submit"
              disabled={!file || uploading}
              className="submit-story-btn"
            >
              {uploading ? 'Sharing...' : 'Share Story'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;
