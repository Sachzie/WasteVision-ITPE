import React from 'react'

function ImageModal({ src, alt = 'image', isOpen, onClose }) {
  if (!isOpen) return null
  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img src={src} alt={alt || 'image preview'} className="image-modal-img" />
      </div>
    </div>
  )
}

export default ImageModal