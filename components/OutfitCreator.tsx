import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/OutfitCreator.module.css';
import toast from 'react-hot-toast';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface OutfitCreatorProps {
  onClose: () => void;
  onSave: (outfit: SavedOutfit) => void;
}

interface SavedOutfit {
  id: string;
  name: string;
  top: ClothingItem | null;
  bottom: ClothingItem | null;
  shoes: ClothingItem | null;
}

const OutfitCreator: React.FC<OutfitCreatorProps> = ({ onClose, onSave }) => {
  const [tops, setTops] = useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = useState<ClothingItem[]>([]);
  const [shoes, setShoes] = useState<ClothingItem[]>([]);
  
  const [currentTopIndex, setCurrentTopIndex] = useState(0);
  const [currentBottomIndex, setCurrentBottomIndex] = useState(0);
  const [currentShoesIndex, setCurrentShoesIndex] = useState(0);
  
  const [outfitName, setOutfitName] = useState('');
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClothes();
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const fetchClothes = async () => {
    try {
      const response = await fetch('/api/clothes/get');
      const data = await response.json();
      
      setTops(data.filter((item: ClothingItem) => item.category === 'tops'));
      setBottoms(data.filter((item: ClothingItem) => item.category === 'bottoms'));
      setShoes(data.filter((item: ClothingItem) => item.category === 'shoes'));
    } catch (error) {
      console.error('Error fetching clothes:', error);
    }
  };

  const handlePrevious = (section: 'top' | 'bottom' | 'shoes') => {
    switch (section) {
      case 'top':
        setCurrentTopIndex((prev) => (prev > 0 ? prev - 1 : tops.length - 1));
        break;
      case 'bottom':
        setCurrentBottomIndex((prev) => (prev > 0 ? prev - 1 : bottoms.length - 1));
        break;
      case 'shoes':
        setCurrentShoesIndex((prev) => (prev > 0 ? prev - 1 : shoes.length - 1));
        break;
    }
  };

  const handleNext = (section: 'top' | 'bottom' | 'shoes') => {
    switch (section) {
      case 'top':
        setCurrentTopIndex((prev) => (prev < tops.length - 1 ? prev + 1 : 0));
        break;
      case 'bottom':
        setCurrentBottomIndex((prev) => (prev < bottoms.length - 1 ? prev + 1 : 0));
        break;
      case 'shoes':
        setCurrentShoesIndex((prev) => (prev < shoes.length - 1 ? prev + 1 : 0));
        break;
    }
  };

  const handleSaveOutfit = async () => {
    if (!outfitName) {
      toast.error('Please enter an outfit name');
      return;
    }

    const outfit: SavedOutfit = {
      id: Date.now().toString(),
      name: outfitName,
      top: tops[currentTopIndex] || null,
      bottom: bottoms[currentBottomIndex] || null,
      shoes: shoes[currentShoesIndex] || null
    };

    toast.success('Outfit saved successfully!');
    onSave(outfit);
    
    setOutfitName('');
    
    onClose();
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent} ref={modalContentRef}>
        <h2 className={styles.title}>Create Your Outfit</h2>
        
        <div className={styles.outfitContainer}>
          {/* Tops Section */}
          <div className={styles.section}>
            <button onClick={() => handlePrevious('top')} className={styles.arrow}>←</button>
            <div className={styles.clothingDisplay}>
              {tops.length > 0 ? (
                <img src={tops[currentTopIndex]?.imageUrl} alt="Top" />
              ) : (
                <div className={styles.placeholder}>No tops available</div>
              )}
            </div>
            <button onClick={() => handleNext('top')} className={styles.arrow}>→</button>
          </div>

          {/* Bottoms Section */}
          <div className={styles.section}>
            <button onClick={() => handlePrevious('bottom')} className={styles.arrow}>←</button>
            <div className={styles.clothingDisplay}>
              {bottoms.length > 0 ? (
                <img src={bottoms[currentBottomIndex]?.imageUrl} alt="Bottom" />
              ) : (
                <div className={styles.placeholder}>No bottoms available</div>
              )}
            </div>
            <button onClick={() => handleNext('bottom')} className={styles.arrow}>→</button>
          </div>

          {/* Shoes Section */}
          <div className={styles.section}>
            <button onClick={() => handlePrevious('shoes')} className={styles.arrow}>←</button>
            <div className={styles.clothingDisplay}>
              {shoes.length > 0 ? (
                <img src={shoes[currentShoesIndex]?.imageUrl} alt="Shoes" />
              ) : (
                <div className={styles.placeholder}>No shoes available</div>
              )}
            </div>
            <button onClick={() => handleNext('shoes')} className={styles.arrow}>→</button>
          </div>
        </div>

        <div className={styles.saveSection}>
          <input
            type="text"
            placeholder="Enter outfit name"
            value={outfitName}
            onChange={(e) => setOutfitName(e.target.value)}
            className={styles.outfitNameInput}
          />
          <div className={styles.buttonGroup}>
            <button onClick={handleSaveOutfit} className={styles.saveButton}>
              Save Outfit
            </button>
            <button onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitCreator;
