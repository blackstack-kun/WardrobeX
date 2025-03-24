import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Wardrobe.module.css';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
}

const Wardrobe: React.FC = () => {
  const router = useRouter();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCloth, setSelectedCloth] = useState<ClothingItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchClothes();
  }, []);

  const fetchClothes = async () => {
    try {
      const response = await fetch('/api/clothes/get');
      if (response.ok) {
        const data = await response.json();
        setClothes(data);
      }
    } catch (error) {
      console.error('Error fetching clothes:', error);
    }
  };

  const handleRemoveCloth = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        const response = await fetch(`/api/clothes/delete`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (response.ok) {
          setClothes(clothes.filter(cloth => cloth.id !== id));
        }
      } catch (error) {
        console.error('Error removing cloth:', error);
      }
    }
  };

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'tops', name: 'Tops' },
    { id: 'bottoms', name: 'Bottoms' },
    { id: 'dresses', name: 'Dresses' },
    { id: 'outerwear', name: 'Outerwear' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'accessories', name: 'Accessories' },
  ];

  const filteredClothes = selectedCategory === 'all' 
    ? clothes 
    : clothes.filter(item => item.category === selectedCategory);

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div 
          className={styles.logo} 
          onClick={() => router.push('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          WardrobeX
        </div>
        <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
          Back to Dashboard
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.categories}>
          {categories.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className={styles.clothesGrid}>
          {filteredClothes.map(item => (
            <div key={item.id} className={styles.clothingItem}>
              <img src={item.imageUrl} alt={item.name} />
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className={styles.category}>{item.category}</span>
              <div className={styles.itemActions}>
                <button 
                  onClick={() => {
                    setSelectedCloth(item);
                    setShowPreview(true);
                  }}
                  className={styles.previewButton}
                >
                  Preview
                </button>
                <button 
                  onClick={() => handleRemoveCloth(item.id)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showPreview && selectedCloth && (
        <div className={styles.previewModal} onClick={() => setShowPreview(false)}>
          <div className={styles.previewContent} onClick={e => e.stopPropagation()}>
            <button 
              className={styles.closeButton}
              onClick={() => setShowPreview(false)}
            >
              ×
            </button>
            <img src={selectedCloth.imageUrl} alt={selectedCloth.name} />
            <div className={styles.previewInfo}>
              <h2>{selectedCloth.name}</h2>
              <p>{selectedCloth.description}</p>
              <span className={styles.previewCategory}>{selectedCloth.category}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wardrobe; 