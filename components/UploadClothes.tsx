import React, { useState, useRef, useEffect } from 'react';
import styles from '@/styles/UploadClothes.module.css';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import toast from 'react-hot-toast';

interface UploadClothesProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UploadClothes: React.FC<UploadClothesProps> = ({ onClose, onUploadSuccess }) => {
  // Form data states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  
  // UI control states
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isCropping, setIsCropping] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiTags, setAiTags] = useState<string[]>([]);
  
  // Cropping states
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        if (!isUploading && uploadStatus !== 'uploading') {
          onClose();
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isUploading, uploadStatus]);

  // Function to handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Clean up previous blob URLs
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image load to set initial crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Set initial crop to center of the image with reasonable size
    setCrop({
      unit: '%',
      width: 80,
      height: 80,
      x: 10,
      y: 10
    });
  };

  // Function to add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Function to remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle key press event for tag input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Function to apply crop
  const handleCropComplete = async () => {
    if (!imgRef.current || !crop || !canvasRef.current) return;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Calculate pixel values from percentages
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY),
    };

    // Set canvas dimensions to match crop
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw cropped image to canvas
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
          toast.error('Failed to crop image. Please try again.');
          return;
        }
        
        // Release previous blob URL if exists
        if (preview && preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
        
        // Create file from blob
        const croppedImageFile = new File([blob], 'cropped-image.png', {
          type: 'image/png',
          lastModified: Date.now(),
        });
        
        // Preview the cropped image
        const croppedImageUrl = URL.createObjectURL(blob);
        setPreview(croppedImageUrl);
        
        // Set file for upload
        setImage(croppedImageFile);
        setIsCropping(false);
        
        // Show success notification
        toast.success('Image successfully cropped!');
        
        resolve(croppedImageFile);
      }, 'image/png', 1);
    });
  };

  // Handle proceeding to details step
  const handleProceedToDetails = () => {
    if (!image) {
      toast.error('Please select and crop an image first');
      return;
    }
    setStep('details');
  };

  // Handle back to image upload
  const handleBackToUpload = () => {
    setStep('upload');
  };

  // Generate AI tags
  const handleGenerateTags = async () => {
    if (!image || !category) {
      toast.error('Please select an image and category first');
      return;
    }

    setIsGeneratingTags(true);
    toast.loading('Generating tags with AI...', { id: 'generating-tags' });
    
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('name', name);
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tags));
      
      const response = await fetch('/api/clothes/generateTags', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAiTags(data.tags);
        toast.success(`Generated ${data.tags.length} tags!`, { id: 'generating-tags' });
      } else {
        toast.error(data.message || 'Failed to generate tags', { id: 'generating-tags' });
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      toast.error('Error generating tags', { id: 'generating-tags' });
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !image) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', category);
      formData.append('tags', JSON.stringify([...tags, ...aiTags]));
      formData.append('image', image);
      formData.append('skipAiTagging', "false");

      const userData = localStorage.getItem('user');
      if (userData) {
        formData.append('userData', userData);
      }

      const response = await fetch('/api/clothes/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      if (result.success) {
        setUploadStatus('success');
        onUploadSuccess();
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading:', error);
      setUploadStatus('error');
      toast.error(error.message || 'Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMore = () => {
    // Clean up URL objects
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    // Reset all states
    setName('');
    setCategory('');
    setTags([]);
    setTagInput('');
    setImage(null);
    setPreview('');
    setUploadStatus('idle');
    setIsCropping(false);
    setCrop(undefined);
    setCompletedCrop(null);
    setStep('upload');
  };

  // Render upload and crop step
  const renderUploadStep = () => (
    <>
      <h2>Upload Clothing Image</h2>
      <div className={styles.uploadStep}>
        <div className={styles.formGroup}>
          <label htmlFor="image">Select Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>
        
        {/* Cropping interface */}
        {isCropping && preview && (
          <div className={styles.cropContainer}>
            <h3>Crop Your Image</h3>
            
            <div className={styles.cropWrapper}>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                className={styles.reactCropElement}
              >
                <img 
                  ref={imgRef}
                  src={preview} 
                  alt="Crop" 
                  onLoad={onImageLoad} 
                  className={styles.cropImage}
                />
              </ReactCrop>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <button 
              type="button" 
              onClick={handleCropComplete}
              className={styles.cropButton}
            >
              Apply Crop
            </button>
          </div>
        )}
        
        {/* Preview after cropping */}
        {!isCropping && preview && (
          <div className={styles.cropConfirmation}>
            <div className={styles.previewContainer}>
              <img 
                src={preview} 
                alt="Preview" 
                className={styles.imagePreview} 
              />
              <button 
                type="button" 
                onClick={() => setIsCropping(true)}
                className={styles.recropButton}
              >
                Crop Again
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className={styles.buttonGroup}>
        {!isCropping && preview && (
          <button 
            type="button" 
            onClick={handleProceedToDetails}
            className={styles.submitButton}
          >
            Next: Add Details
          </button>
        )}
        <button 
          type="button" 
          onClick={onClose}
          className={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </>
  );

  // Render details step
  const renderDetailsStep = () => (
    <>
      <h2>Add Clothing Details</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.detailsStep}>
          <div className={styles.detailsPreview}>
            <img 
              src={preview} 
              alt="Preview" 
              className={styles.thumbnailPreview} 
            />
          </div>
          
          <div className={styles.detailsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                <option value="tops">Tops</option>
                <option value="bottoms">Bottoms</option>
                <option value="dresses">Dresses</option>
                <option value="outerwear">Outerwear</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags</label>
              <div className={styles.tagInputContainer}>
                <input
                  type="text"
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tags and press Enter"
                />
                <button 
                  type="button" 
                  onClick={handleAddTag}
                  className={styles.addTagButton}
                >
                  Add
                </button>
              </div>
              
              <div className={styles.aiTagsInfo}>
                <button
                  type="button"
                  onClick={handleGenerateTags}
                  className={styles.generateTagsButton}
                  disabled={isGeneratingTags || !image || !category}
                >
                  {isGeneratingTags ? 'Generating...' : 'Generate AI Tags ✨'}
                </button>
                <span>
                  <i>AI will analyze your image and suggest relevant tags</i>
                </span>
              </div>
              
              {/* User tags */}
              {tags.length > 0 && (
                <div className={styles.tagsList}>
                  <div className={styles.tagsLabel}>Your Tags:</div>
                  {tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(tag)}
                        className={styles.removeTagButton}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* AI tags */}
              {aiTags.length > 0 && (
                <div className={styles.tagsList + ' ' + styles.aiTagsList}>
                  <div className={styles.tagsLabel}>AI Generated Tags:</div>
                  {aiTags.map((tag, index) => (
                    <span key={index} className={`${styles.tag} ${styles.aiTag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={handleBackToUpload}
            className={styles.backButton}
          >
            Back
          </button>
          <button 
            type="submit" 
            disabled={isUploading}
            className={styles.submitButton}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </>
  );

  // Render success message
  const renderSuccessMessage = () => (
    <div className={styles.successMessage}>
      <h2>Upload Successful!</h2>
      <div className={styles.buttonGroup}>
        <button 
          onClick={handleAddMore}
          className={styles.submitButton}
        >
          Add More
        </button>
        <button 
          onClick={onClose}
          className={styles.cancelButton}
        >
          Back to Wardrobe
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} ref={modalContentRef}>
        <button 
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>
        
        {uploadStatus === 'success' ? (
          renderSuccessMessage()
        ) : (
          step === 'upload' ? renderUploadStep() : renderDetailsStep()
        )}
      </div>
    </div>
  );
};

export default UploadClothes; 