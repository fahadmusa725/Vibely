import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faFaceSmile, faGlobe, faHashtag, faImage, faLocationDot, faSpinner, faTag, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('4/5');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (images.length + selectedFiles.length > 10) {
      setError('You can upload a maximum of 10 images per post.');
      return;
    }

    setError('');
    const newImages = [...images, ...selectedFiles];
    setImages(newImages);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setImages(updatedImages);
    setPreviewUrls(updatedPreviews);

    if (currentPreviewIdx >= updatedPreviews.length) {
      setCurrentPreviewIdx(Math.max(0, updatedPreviews.length - 1));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (images.length === 0) {
      setError('Please select at least one image.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      images.forEach((img) => {
        formData.append('images', img);
      });
      formData.append('caption', caption);
      formData.append('location', location);
      formData.append('tags', tags);

      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        if (onPostCreated) {
          onPostCreated(res.data.data);
        }
        handleClose();
      }
    } catch (err) {
      console.error('Post creation failed:', err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setImages([]);
    setPreviewUrls([]);
    setCurrentPreviewIdx(0);
    setStep(1);
    setCaption('');
    setLocation('');
    setTags('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay create-modal-overlay" onClick={handleClose}>
      <div
        className={`create-modal-container ${step === 2 ? 'step-two-expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-modal-header">
          {step === 2 ? (
            <button className="icon-btn-ghost back-step-btn" onClick={() => setStep(1)}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: 20 }} />
            </button>
          ) : (
            <div className="header-placeholder" />
          )}

          <h3 className="create-modal-title">
            {step === 1 ? 'Create new post' : 'Crop & details'}
          </h3>

          {previewUrls.length > 0 ? (
            step === 1 ? (
              <button
                className="step-next-btn"
                onClick={() => setStep(2)}
              >
                Next
              </button>
            ) : (
              <button
                className="step-share-btn"
                onClick={handleSubmit}
                disabled={loading || (!caption.trim() && previewUrls.length === 0)}
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" style={{ fontSize: 16 }} /> : 'Post'}
              </button>
            )
          ) : (
            <button className="icon-btn-ghost" onClick={handleClose}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: 20 }} />
            </button>
          )}
        </div>

        {error && <div className="create-modal-error">{error}</div>}

        <div className="create-modal-body">
          {step === 1 ? (
            previewUrls.length === 0 ? (
              <div
                className="create-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="dropzone-icon-ring">
                  <FontAwesomeIcon icon={faImage} style={{ fontSize: 48, color: '#0095f6' }} />
                </div>
                <h4>Drag photos and videos here</h4>
                <p>Support JPG, PNG, WEBP up to 10MB each</p>
                <button type="button" className="btn btn-primary select-computer-btn">
                  Select from computer
                </button>
              </div>
            ) : (
              <div className="create-preview-stage">
                <div
                  className="stage-image-wrapper"
                  style={{ aspectRatio: aspectRatio }}
                >
                  <img
                    src={previewUrls[currentPreviewIdx]}
                    alt="Current preview"
                    className="stage-preview-img"
                  />

                  {previewUrls.length > 1 && (
                    <>
                      <button
                        className="carousel-btn prev"
                        onClick={() =>
                          setCurrentPreviewIdx((prev) =>
                            prev > 0 ? prev - 1 : previewUrls.length - 1
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: 18 }} />
                      </button>
                      <button
                        className="carousel-btn next"
                        onClick={() =>
                          setCurrentPreviewIdx((prev) =>
                            prev < previewUrls.length - 1 ? prev + 1 : 0
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: 18 }} />
                      </button>
                    </>
                  )}

                  <div className="aspect-ratio-controls">
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '4/5' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('4/5')}
                      title="Portrait 4:5 ratio"
                    >
                      4:5
                    </button>
                    <button
                      type="button"
                      className={`ratio-btn ${aspectRatio === '1/1' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('1/1')}
                      title="Square 1:1 ratio"
                    >
                      1:1
                    </button>
                  </div>
                </div>

                <div className="thumbnails-strip">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className={`thumb-box ${idx === currentPreviewIdx ? 'selected' : ''}`}
                      onClick={() => setCurrentPreviewIdx(idx)}
                    >
                      <img src={url} alt={`Thumb ${idx + 1}`} />
                      <button
                        type="button"
                        className="thumb-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                      >
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  ))}
                  {previewUrls.length < 10 && (
                    <button
                      type="button"
                      className="thumb-add-more"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="create-split-view">
              <div className="split-preview-pane">
                <div
                  className="stage-image-wrapper"
                  style={{ aspectRatio: aspectRatio }}
                >
                  <img
                    src={previewUrls[currentPreviewIdx]}
                    alt="Final preview"
                    className="stage-preview-img"
                  />
                  {previewUrls.length > 1 && (
                    <div className="carousel-dots">
                      {previewUrls.map((_, idx) => (
                        <span
                          key={idx}
                          className={`dot ${idx === currentPreviewIdx ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="split-details-pane">
                <div className="creator-user-row">
                  <img src={user?.avatar} alt={user?.fullName} className="creator-avatar" />
                  <div className="creator-meta">
                    <span className="creator-username">{user?.username}</span>
                    <div className="creator-privacy-badge">
                      <FontAwesomeIcon icon={faGlobe} style={{ fontSize: 12 }} />
                      <span>Public</span>
                    </div>
                  </div>
                </div>

                <div className="caption-input-group">
                  <textarea
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={6}
                    maxLength={2200}
                    className="create-caption-textarea"
                  />
                  <div className="caption-footer-meta">
                    <span className="char-count">{caption.length}/2,200</span>
                  </div>
                </div>

                <div className="details-field-row">
                  <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 16 }} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Add location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="details-field-input"
                  />
                </div>

                <div className="details-field-row">
                  <FontAwesomeIcon icon={faHashtag} style={{ fontSize: 16 }} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="details-field-input"
                  />
                </div>

                <div className="add-to-post-row">
                  <span className="add-to-post-label">Add to your post</span>
                  <div className="add-to-post-icons">
                    <button type="button" className="add-icon-btn photo-add" title="Add more photos" onClick={() => fileInputRef.current?.click()}>
                      <FontAwesomeIcon icon={faImage} style={{ fontSize: 20 }} />
                    </button>
                    <button type="button" className="add-icon-btn tag-add" title="Tag people">
                      <FontAwesomeIcon icon={faTag} style={{ fontSize: 20 }} />
                    </button>
                    <button type="button" className="add-icon-btn feeling-add" title="Add feeling">
                      <FontAwesomeIcon icon={faFaceSmile} style={{ fontSize: 20 }} />
                    </button>
                    <button type="button" className="add-icon-btn location-add" title="Add location">
                      <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: 20 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
