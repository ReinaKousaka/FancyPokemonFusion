import React from 'react';

function SavedGallery({ gallery, onLoadFusion, onDeleteFusion }) {
  return (
    <div className="gallery-panel">
      <h3 className="prompt-title">
        <span>🎨</span> Saved Creations Gallery
      </h3>
      <p className="prompt-desc">
        View, reload, or manage your custom Pokemon fusions. (Saved locally in your browser)
      </p>

      {gallery.length > 0 ? (
        <div className="gallery-grid scrollbar-thin">
          {gallery.map(item => (
            <div key={item.id} className="gallery-card">
              {/* Thumbnail */}
              <div className="card-thumb-box">
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="card-thumb-img"
                />
                <div className="card-badge">Gen 1 Fusion</div>
              </div>

              {/* Information */}
              <div className="card-info-box">
                <div>
                  <h4 className="card-title">{item.name}</h4>
                  <div className="card-details-list">
                    <div className="card-detail-item">
                      <span className="card-detail-label">Body:</span> {item.config.body?.name}
                    </div>
                    {item.config.head && (
                      <div className="card-detail-item">
                        <span className="card-detail-label">Head:</span> {item.config.head.name}
                      </div>
                    )}
                    {item.config.color && (
                      <div className="card-detail-item">
                        <span className="card-detail-label">Palette:</span> {item.config.color.name}
                      </div>
                    )}
                    {(item.config.wings || item.config.tail) && (
                      <div className="card-detail-item card-detail-extras">
                        <span className="card-detail-label">Extras:</span> {[
                          item.config.wings?.name,
                          item.config.tail?.name
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() => onLoadFusion(item.config)}
                    className="card-load-btn"
                  >
                    Load & Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFusion(item.id)}
                    className="card-delete-btn"
                    title="Delete Fusion"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-gallery">
          <div className="empty-gallery-icon">🥚</div>
          <p className="empty-gallery-title">No Fusions Saved Yet</p>
          <p className="empty-gallery-desc">
            Create an amazing Pokemon mashup and click "Save to Gallery" to see it here!
          </p>
        </div>
      )}
    </div>
  );
}

export default SavedGallery;
