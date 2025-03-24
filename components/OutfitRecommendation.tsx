import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/OutfitRecommendation.module.css';
import toast from 'react-hot-toast';

interface OutfitRecommendationProps {
  onClose: () => void;
  onSaveRecommendation: (outfit: any) => void;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
  userId: string;
}

interface RecommendedOutfit {
  id: string;
  name: string;
  description: string;
  top: ClothingItem | null;
  bottom: ClothingItem | null;
  shoes: ClothingItem | null;
  occasion: string;
  weather: string;
  season: string;
  date: string;
}

const OutfitRecommendation: React.FC<OutfitRecommendationProps> = ({ onClose, onSaveRecommendation }) => {
  const [weather, setWeather] = useState<string>('');
  const [season, setSeason] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [recommendedOutfit, setRecommendedOutfit] = useState<RecommendedOutfit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [recommendation, setRecommendation] = useState<RecommendedOutfit | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weather || !season || !occasion) {
      toast.error('Please fill out all required fields');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setRecommendation(null);
    toast.loading('Generating your personalized outfit recommendation...', { id: 'generating-outfit' });
    
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('User data not found');
      }
      
      const user = JSON.parse(userData);
      const userId = user.id;
      
      const response = await fetch('/api/outfit/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weather,
          season,
          occasion,
          additionalInfo
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to get recommendation');
      }
      
      if (!data.success || !data.outfit) {
        throw new Error('Invalid response from recommendation service');
      }
      
      setRecommendation(data.outfit);
      setRecommendedOutfit({
        ...data.outfit,
        date: new Date().toISOString(),
        id: `rec-${Date.now()}`
      });
      toast.success('Outfit recommendation generated!', { id: 'generating-outfit' });
    } catch (err: any) {
      console.error('Recommendation error:', err);
      setError(err.message || 'Failed to generate recommendation');
      toast.error(err.message || 'Failed to generate recommendation', { id: 'generating-outfit' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecommendation = () => {
    if (recommendedOutfit) {
      onSaveRecommendation(recommendedOutfit);
      toast.success('Recommendation saved to your collection!');
      onClose();
    }
  };

  const handleAdditionalInfoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAdditionalInfo(e.target.value);
    if (e.target.value.trim() === "CraziestProject") {
      setShowEasterEgg(true);
    }
  };

  const closeEasterEgg = () => {
    setShowEasterEgg(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h2>{recommendedOutfit ? 'Your Outfit Recommendation' : 'Get Outfit Recommendation'}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        {showEasterEgg && (
          <div className={styles.easterEggOverlay}>
            <div className={styles.easterEggModal}>
              <button onClick={closeEasterEgg} className={styles.closeEasterEggButton}>×</button>
              <h2 className={styles.easterEggTitle}>🎉 WardrobeX 🎉</h2>
              <div className={styles.easterEggContent}>
                <p>Built with ❤️ by:</p>
                <ul className={styles.creditsList}>
                  <li>Sudip</li>
                  <li>Shruti</li>
                  <li>Vivek</li>
                  <li>Shivam</li>
                </ul>
                <p className={styles.easterEggMessage}>Thanks for discovering our Easter egg!</p>
              </div>
            </div>
          </div>
        )}
        
        {!recommendedOutfit ? (
          <div className={styles.modalContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="weather">Weather *</label>
                <select
                  id="weather"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  required
                >
                  <option value="">Select weather condition</option>
                  <option value="sunny">Sunny</option>
                  <option value="cloudy">Cloudy</option>
                  <option value="rainy">Rainy</option>
                  <option value="snowy">Snowy</option>
                  <option value="windy">Windy</option>
                  <option value="hot">Hot</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="season">Season *</label>
                <select
                  id="season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  required
                >
                  <option value="">Select season</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                  <option value="winter">Winter</option>
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="occasion">Occasion *</label>
                <select
                  id="occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  required
                >
                  <option value="">Select occasion</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="business">Business</option>
                  <option value="party">Party</option>
                  <option value="date">Date</option>
                  <option value="workout">Workout</option>
                  <option value="beach">Beach</option>
                  <option value="travel">Travel</option>
                </select>
              </div>
              
              <div className={styles.inputGroup}>
                <label htmlFor="additionalInfo">Additional Information (optional)</label>
                <textarea
                  id="additionalInfo"
                  value={additionalInfo}
                  onChange={handleAdditionalInfoChange}
                  placeholder="Tell us more about your needs, e.g., 'I want something colorful' or 'I prefer comfortable clothes'"
                  rows={4}
                ></textarea>
              </div>
              
              <div className={styles.buttonGroup}>
                <button 
                  type="button" 
                  onClick={onClose}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={styles.submitButton}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Generating...' : 'Get Recommendation'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.recommendationResult}>
            <h3 className={styles.outfitName}>{recommendedOutfit.name}</h3>
            <p className={styles.outfitDescription}>{recommendedOutfit.description}</p>
            
            <div className={styles.outfitItems}>
              {recommendedOutfit.top && (
                <div className={styles.outfitItem}>
                  <img 
                    src={recommendedOutfit.top.imageUrl} 
                    alt={recommendedOutfit.top.name} 
                    className={styles.outfitItemImage}
                  />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemLabel}>Top</span>
                    <span className={styles.itemName}>{recommendedOutfit.top.name}</span>
                  </div>
                </div>
              )}
              
              {recommendedOutfit.bottom && (
                <div className={styles.outfitItem}>
                  <img 
                    src={recommendedOutfit.bottom.imageUrl} 
                    alt={recommendedOutfit.bottom.name} 
                    className={styles.outfitItemImage}
                  />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemLabel}>Bottom</span>
                    <span className={styles.itemName}>{recommendedOutfit.bottom.name}</span>
                  </div>
                </div>
              )}
              
              {recommendedOutfit.shoes && (
                <div className={styles.outfitItem}>
                  <img 
                    src={recommendedOutfit.shoes.imageUrl} 
                    alt={recommendedOutfit.shoes.name} 
                    className={styles.outfitItemImage}
                  />
                  <div className={styles.itemInfo}>
                    <span className={styles.itemLabel}>Shoes</span>
                    <span className={styles.itemName}>{recommendedOutfit.shoes.name}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.outfitDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Occasion:</span>
                <span className={styles.detailValue}>{recommendedOutfit.occasion}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Weather:</span>
                <span className={styles.detailValue}>{recommendedOutfit.weather}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Season:</span>
                <span className={styles.detailValue}>{recommendedOutfit.season}</span>
              </div>
            </div>
            
            <div className={styles.buttonGroup}>
              <button
                onClick={onClose}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecommendation}
                className={styles.saveButton}
              >
                Save Recommendation
              </button>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>AI is creating your perfect outfit...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={handleSubmit}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutfitRecommendation; 