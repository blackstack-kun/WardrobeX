import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Dashboard.module.css';
import UploadClothes from '@/components/UploadClothes';
import OutfitCreator from '@/components/OutfitCreator';
import OutfitRecommendation from '@/components/OutfitRecommendation';
import toast from 'react-hot-toast';

interface User {
  name: string;
  email: string;
  imageUrl: string;
  id: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
  userId: string;
}

interface SavedOutfit {
  id: string;
  name: string;
  top: ClothingItem | null;
  bottom: ClothingItem | null;
  shoes: ClothingItem | null;
}

interface RecommendedOutfit extends SavedOutfit {
  description: string;
  occasion: string;
  weather: string;
  season: string;
  date: string;
}

interface PreviewItem {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags: string[];
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOutfitCreator, setShowOutfitCreator] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'clothes' | 'outfits' | 'recommendations'>('dashboard');
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [filteredClothes, setFilteredClothes] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedOutfit[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [previewItem, setPreviewItem] = useState<PreviewItem | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (activeSection === 'clothes') {
        fetchClothes(parsedUser.id);
      } else if (activeSection === 'outfits') {
        loadOutfits();
      } else if (activeSection === 'recommendations') {
        loadRecommendations();
      }
    }
  }, [activeSection]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const menuContainer = document.querySelector(`.${styles.userMenuContainer}`);
      if (menuContainer && !menuContainer.contains(target)) {
        setShowUserMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [styles.userMenuContainer]);

  const fetchClothes = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clothes?userId=${userId}`);
      
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

  const loadOutfits = () => {
    const savedOutfits = localStorage.getItem('savedOutfits');
    if (savedOutfits) {
      setOutfits(JSON.parse(savedOutfits));
    }
  };

  const loadRecommendations = () => {
    const savedRecommendations = localStorage.getItem('savedRecommendations');
    if (savedRecommendations) {
      setRecommendations(JSON.parse(savedRecommendations));
    }
  };

  // Apply filters when any filter option changes
  useEffect(() => {
    if (activeSection !== 'clothes') return;
    
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
  }, [clothes, selectedCategory, selectedTag, searchQuery, activeSection]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    toast.success('Item uploaded successfully');
    if (activeSection === 'clothes' && user) {
      fetchClothes(user.id);
    }
  };

  const handleSaveOutfit = (outfit: any) => {
    const savedOutfits = JSON.parse(localStorage.getItem('savedOutfits') || '[]');
    savedOutfits.push(outfit);
    localStorage.setItem('savedOutfits', JSON.stringify(savedOutfits));
    // Toast is already shown in OutfitCreator component
  };

  const handleDeleteOutfit = (outfitId: string) => {
    // Create a custom toast with confirm/cancel buttons
    toast((t) => (
      <div className={styles.deleteConfirmToast}>
        <p>Are you sure you want to delete this outfit?</p>
        <div className={styles.toastButtons}>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              const updatedOutfits = outfits.filter(outfit => outfit.id !== outfitId);
              localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits));
              setOutfits(updatedOutfits);
              toast.success('Outfit deleted successfully');
            }}
            className={styles.confirmDeleteButton}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className={styles.cancelDeleteButton}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000, // 10 seconds to decide
      position: 'top-center',
    });
  };

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

  const handleDeleteClothing = async (id: string) => {
    // Create a custom toast with confirm/cancel buttons
    toast((t) => (
      <div className={styles.deleteConfirmToast}>
        <p>Are you sure you want to delete this item?</p>
        <div className={styles.toastButtons}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const response = await fetch(`/api/clothes/${id}`, {
                  method: 'DELETE',
                });
                
                if (response.ok) {
                  toast.success('Item deleted successfully');
                  // Update the clothes state by removing the deleted item
                  setClothes(prevClothes => prevClothes.filter(item => item.id !== id));
                  setFilteredClothes(prevFiltered => prevFiltered.filter(item => item.id !== id));
                } else {
                  const data = await response.json();
                  toast.error(data.message || 'Failed to delete item');
                }
              } catch (error) {
                console.error('Error deleting clothing item:', error);
                toast.error('Failed to delete item. Please try again.');
              }
            }}
            className={styles.confirmDeleteButton}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className={styles.cancelDeleteButton}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000, // 10 seconds to decide
      position: 'top-center',
    });
  };

  const handleSaveRecommendation = (outfit: RecommendedOutfit) => {
    const savedRecommendations = JSON.parse(localStorage.getItem('savedRecommendations') || '[]');
    savedRecommendations.push(outfit);
    localStorage.setItem('savedRecommendations', JSON.stringify(savedRecommendations));
    setRecommendations(savedRecommendations);
    toast.success('Outfit recommendation saved!');
  };

  const handleDeleteRecommendation = (recommendationId: string) => {
    // Create a custom toast with confirm/cancel buttons
    toast((t) => (
      <div className={styles.deleteConfirmToast}>
        <p>Are you sure you want to delete this recommendation?</p>
        <div className={styles.toastButtons}>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              const updatedRecommendations = recommendations.filter(rec => rec.id !== recommendationId);
              localStorage.setItem('savedRecommendations', JSON.stringify(updatedRecommendations));
              setRecommendations(updatedRecommendations);
              toast.success('Recommendation deleted successfully');
            }}
            className={styles.confirmDeleteButton}
          >
            Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className={styles.cancelDeleteButton}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000, // 10 seconds to decide
      position: 'top-center',
    });
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>WardrobeX</div>
        <div className={styles.userSection}>
          <img src={user.imageUrl} alt={user.name} className={styles.userImage} />
          <span className={styles.userName}>{user.name}</span>
          <div className={styles.userMenuContainer}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className={styles.menuButton}>
              ⋮
            </button>
            {showUserMenu && (
              <div className={styles.userMenu}>
                <div className={styles.userMenuHeader}>
                  <span className={styles.accountName}>{user.email}</span>
                </div>
                <button onClick={() => {}} className={styles.menuItem}>
                  Settings
                </button>
                <button onClick={handleLogout} className={styles.menuItem}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.sidebar}>
          <ul>
            <li 
              className={activeSection === 'dashboard' ? styles.active : ''}
              onClick={() => setActiveSection('dashboard')}
            >
              Home
            </li>
            <li 
              className={activeSection === 'clothes' ? styles.active : ''}
              onClick={() => {
                setActiveSection('clothes');
                if (user) fetchClothes(user.id);
              }}
            >
              My Wardrobe
            </li>
            <li 
              className={activeSection === 'outfits' ? styles.active : ''}
              onClick={() => setActiveSection('outfits')}
            >
              My Outfits
            </li>
            <li 
              className={activeSection === 'recommendations' ? styles.active : ''}
              onClick={() => setActiveSection('recommendations')}
            >
              Recommendations
            </li>
          </ul>
        </div>

        {activeSection === 'dashboard' && (
          <div className={styles.content}>
            <h1>Welcome to Your Wardrobe</h1>
            <div className={styles.gridContainer}>
              <div className={styles.card} onClick={() => setShowUploadModal(true)}>
                <h3>Upload Clothes</h3>
                <p>Add new items to your wardrobe</p>
              </div>
              <div className={styles.card} onClick={() => setShowOutfitCreator(true)}>
                <h3>Create Outfit</h3>
                <p>Mix and match your clothes</p>
              </div>
              <div className={styles.card} onClick={() => setShowRecommendation(true)}>
                <h3>Get Recommendations</h3>
                <p>AI-powered outfit suggestions</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'clothes' && (
          <div className={styles.content}>
            <h1>My Wardrobe</h1>
            <div className={styles.actions}>
              <button 
                onClick={() => setShowUploadModal(true)}
                className={styles.addButton}
              >
                Add New Item
              </button>
            </div>
            
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
                    <div 
                      className={styles.imageContainer}
                      onClick={() => {
                        setPreviewItem({
                          id: item.id,
                          name: item.name,
                          category: item.category,
                          imageUrl: item.imageUrl,
                          tags: item.tags
                        });
                      }}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className={styles.clothingImage} 
                      />
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClothing(item.id);
                        }}
                      >
                        <span>×</span>
                      </button>
                    </div>
                    <div className={styles.clothingDetails}>
                      <h3>{item.name}</h3>
                      <p className={styles.category}>{getCategoryDisplayName(item.category)}</p>
                      <div className={styles.tagContainer}>
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span 
                            key={index} 
                            className={styles.tag}
                            onClick={() => setSelectedTag(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className={styles.moreTag}>+{item.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'outfits' && (
          <div className={styles.content}>
            <h1>My Outfits</h1>
            <div className={styles.actions}>
              <button 
                onClick={() => setShowOutfitCreator(true)}
                className={styles.addButton}
              >
                Create New Outfit
              </button>
            </div>
            
            {outfits.length === 0 ? (
              <div className={styles.emptyState}>
                <p>You haven't created any outfits yet.</p>
                <button 
                  onClick={() => setShowOutfitCreator(true)}
                  className={styles.addButton}
                >
                  Create Your First Outfit
                </button>
              </div>
            ) : (
              <div className={styles.outfitsGrid}>
                {outfits.map(outfit => (
                  <div key={outfit.id} className={styles.outfitCard}>
                    <h3>{outfit.name}</h3>
                    <div className={styles.outfitItems}>
                      {outfit.top && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={outfit.top.imageUrl} 
                            alt={outfit.top.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Top</span>
                        </div>
                      )}
                      {outfit.bottom && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={outfit.bottom.imageUrl} 
                            alt={outfit.bottom.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Bottom</span>
                        </div>
                      )}
                      {outfit.shoes && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={outfit.shoes.imageUrl} 
                            alt={outfit.shoes.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Shoes</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.outfitActions}>
                      <button 
                        onClick={() => handleDeleteOutfit(outfit.id)}
                        className={styles.outfitDeleteButton}
                        title="Delete outfit"
                      >
                        <span>×</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'recommendations' && (
          <div className={styles.content}>
            <h1>AI Outfit Recommendations</h1>
            <div className={styles.actions}>
              <button 
                onClick={() => setShowRecommendation(true)}
                className={styles.addButton}
              >
                Get New Recommendation
              </button>
            </div>
            
            {recommendations.length === 0 ? (
              <div className={styles.emptyState}>
                <p>You haven't saved any outfit recommendations yet.</p>
                <button 
                  onClick={() => setShowRecommendation(true)}
                  className={styles.addButton}
                >
                  Get Your First Recommendation
                </button>
              </div>
            ) : (
              <div className={styles.recommendationsGrid}>
                {recommendations.map(recommendation => (
                  <div key={recommendation.id} className={styles.recommendationCard}>
                    <div className={styles.recommendationHeader}>
                      <h3>{recommendation.name}</h3>
                      <span className={styles.recommendationDate}>
                        {new Date(recommendation.date).toLocaleDateString()}
                      </span>
                      <button 
                        onClick={() => handleDeleteRecommendation(recommendation.id)}
                        className={styles.outfitDeleteButton}
                        title="Delete recommendation"
                      >
                        <span>×</span>
                      </button>
                    </div>
                    
                    <p className={styles.recommendationDescription}>
                      {recommendation.description}
                    </p>
                    
                    <div className={styles.recommendationTags}>
                      <span className={styles.recommendationTag}>{recommendation.occasion}</span>
                      <span className={styles.recommendationTag}>{recommendation.weather}</span>
                      <span className={styles.recommendationTag}>{recommendation.season}</span>
                    </div>
                    
                    <div className={styles.outfitItems}>
                      {recommendation.top && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={recommendation.top.imageUrl} 
                            alt={recommendation.top.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Top</span>
                        </div>
                      )}
                      {recommendation.bottom && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={recommendation.bottom.imageUrl} 
                            alt={recommendation.bottom.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Bottom</span>
                        </div>
                      )}
                      {recommendation.shoes && (
                        <div className={styles.outfitItem}>
                          <img 
                            src={recommendation.shoes.imageUrl} 
                            alt={recommendation.shoes.name} 
                            className={styles.outfitItemImage}
                          />
                          <span className={styles.outfitItemLabel}>Shoes</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {showUploadModal && (
        <UploadClothes 
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {showOutfitCreator && (
        <OutfitCreator
          onClose={() => setShowOutfitCreator(false)}
          onSave={handleSaveOutfit}
        />
      )}

      {showRecommendation && (
        <OutfitRecommendation
          onClose={() => setShowRecommendation(false)}
          onSaveRecommendation={handleSaveRecommendation}
        />
      )}

      {previewItem && (
        <div className={styles.previewModal} onClick={() => setPreviewItem(null)}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.closeButton}
              onClick={() => setPreviewItem(null)}
            >
              ×
            </button>
            <div className={styles.previewImageContainer}>
              <img 
                src={previewItem.imageUrl} 
                alt={previewItem.name} 
                className={styles.previewImage} 
              />
            </div>
            <div className={styles.previewDetails}>
              <h2>{previewItem.name}</h2>
              <p className={styles.previewCategory}>{getCategoryDisplayName(previewItem.category)}</p>
              <div className={styles.previewTagSection}>
                <h3>All Tags:</h3>
                <div className={styles.previewTagContainer}>
                  {previewItem.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={styles.tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setPreviewItem(null);
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  {previewItem.tags.length === 0 && (
                    <p className={styles.noTags}>No tags added to this item</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 