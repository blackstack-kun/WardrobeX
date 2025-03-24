import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Outfits.module.css';
import toast from 'react-hot-toast';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

interface SavedOutfit {
  id: string;
  name: string;
  top: ClothingItem | null;
  bottom: ClothingItem | null;
  shoes: ClothingItem | null;
}

const Outfits: React.FC = () => {
  const router = useRouter();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);

  useEffect(() => {
    loadOutfits();
  }, []);

  const loadOutfits = () => {
    const savedOutfits = localStorage.getItem('savedOutfits');
    if (savedOutfits) {
      setOutfits(JSON.parse(savedOutfits));
    }
  };

  const handleDeleteOutfit = (outfitId: string) => {
    toast.custom((t) => (
      <div className={styles.confirmToast}>
        <p>Are you sure you want to delete this outfit?</p>
        <div className={styles.confirmButtons}>
          <button 
            onClick={() => {
              const updatedOutfits = outfits.filter(outfit => outfit.id !== outfitId);
              localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits));
              setOutfits(updatedOutfits);
              toast.dismiss(t.id);
              toast.success('Outfit deleted successfully');
            }}
            className={styles.confirmButton}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

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
        <h1 className={styles.title}>My Outfits</h1>
        
        {outfits.length === 0 ? (
          <div className={styles.noOutfits}>
            <p>No outfits saved yet. Create your first outfit!</p>
            <button 
              onClick={() => router.push('/dashboard')}
              className={styles.createButton}
            >
              Create Outfit
            </button>
          </div>
        ) : (
          <div className={styles.outfitsGrid}>
            {outfits.map((outfit) => (
              <div key={outfit.id} className={styles.outfitCard}>
                <h3 className={styles.outfitName}>{outfit.name}</h3>
                <div className={styles.outfitPreview}>
                  {outfit.top && (
                    <div className={styles.clothingItem}>
                      <img src={outfit.top.imageUrl} alt="Top" />
                      <span>Top</span>
                    </div>
                  )}
                  {outfit.bottom && (
                    <div className={styles.clothingItem}>
                      <img src={outfit.bottom.imageUrl} alt="Bottom" />
                      <span>Bottom</span>
                    </div>
                  )}
                  {outfit.shoes && (
                    <div className={styles.clothingItem}>
                      <img src={outfit.shoes.imageUrl} alt="Shoes" />
                      <span>Shoes</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteOutfit(outfit.id)}
                  className={styles.deleteButton}
                >
                  Delete Outfit
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Outfits; 