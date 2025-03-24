import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Clothes.module.css';
import toast from 'react-hot-toast';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
  userId: string;
}

const Clothes = () => {
  const router = useRouter();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch clothing items
  useEffect(() => {
    const fetchClothes = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/');
          return;
        }

        const user = JSON.parse(userData);
        const response = await fetch(`/api/clothes?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch clothes');
        }
        
        const data = await response.json();
        setClothes(data);
        setFilteredClothes(data);
        
        // Extract unique tags from all clothes
        const tags = data.flatMap((item: ClothingItem) => item.tags);
        const uniqueTags = Array.from(new Set(tags)) as string[];
        setAllTags(uniqueTags);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching clothes:', error);
        toast.error('Failed to load your wardrobe');
        setIsLoading(false);
      }
    };

    fetchClothes();
  }, [router]);

  // Apply filters when any filter option changes
  useEffect(() => {
    let filtered = [...clothes];
    
    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by tag if selected
    if (selectedTag) {
      filtered = filtered.filter(item => item.tags.includes(selectedTag));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.name.toLowerCase().includes(query) || 
          item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredClothes(filtered);
  }, [clothes, selectedCategory, selectedTag, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSearchQuery('');
  };

  // Helper to get category display name
  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div 
          className={styles.logo}
          onClick={() => router.push('/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          Wardrobe
        </div>
        <div className={styles.navLinks}>
          <div onClick={() => router.push('/dashboard')}>Dashboard</div>
          <div className={styles.active}>My Clothes</div>
          <div onClick={() => router.push('/outfits')}>Outfits</div>
        </div>
      </nav>

      <main className={styles.main}>
        <h1>My Wardrobe</h1>
        
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <input
              type="text"
              placeholder="Search by name or tag"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              <option value="tops">Tops</option>
              <option value="bottoms">Bottoms</option>
              <option value="dresses">Dresses</option>
              <option value="outerwear">Outerwear</option>
              <option value="shoes">Shoes</option>
              <option value="accessories">Accessories</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleResetFilters}
            className={styles.resetButton}
          >
            Reset Filters
          </button>
        </div>
        
        {isLoading ? (
          <div className={styles.loading}>Loading your wardrobe...</div>
        ) : filteredClothes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No clothing items found.</p>
            {clothes.length > 0 && (
              <button 
                onClick={handleResetFilters}
                className={styles.resetButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={styles.clothesGrid}>
            {filteredClothes.map(item => (
              <div key={item.id} className={styles.clothingCard}>
                <div className={styles.imageContainer}>
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className={styles.clothingImage} 
                  />
                </div>
                <div className={styles.clothingDetails}>
                  <h3>{item.name}</h3>
                  <p className={styles.category}>{getCategoryDisplayName(item.category)}</p>
                  <div className={styles.tagContainer}>
                    {item.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className={styles.tag}
                        onClick={() => setSelectedTag(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clothes; 