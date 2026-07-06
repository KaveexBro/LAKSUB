import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AdCampaign } from '../types';
import { Plus, Edit, Trash2, Check, X, Image as ImageIcon, Link as LinkIcon, Tag, LayoutTemplate } from 'lucide-react';

export const AdManager: React.FC = () => {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [adToDelete, setAdToDelete] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState<Partial<AdCampaign>>({
    campaignName: '',
    type: 'direct',
    zones: ['home-top'],
    imageUrl: '',
    targetUrl: '',
    isActive: true,
    displayFrequency: 1,
    deviceTargeting: 'all'
  });

  const fetchAds = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'ad_campaigns'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign)));
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSave = async () => {
    if (!currentAd.campaignName || (!currentAd.zones || currentAd.zones.length === 0)) {
      alert("Campaign Name and at least one Zone are required.");
      return;
    }

    if (currentAd.type === 'direct' && (!currentAd.imageUrl || !currentAd.targetUrl)) {
      alert("Image URL and Target URL are required for direct ads.");
      return;
    }

    try {
      if (currentAd.id) {
        await updateDoc(doc(db, 'ad_campaigns', currentAd.id), currentAd);
      } else {
        await addDoc(collection(db, 'ad_campaigns'), {
          ...currentAd,
          createdAt: new Date().toISOString()
        });
      }
      setIsEditing(false);
      setCurrentAd({
        campaignName: '',
        type: 'direct',
        zones: ['home-top'],
        imageUrl: '',
        targetUrl: '',
        isActive: true,
        displayFrequency: 1,
    deviceTargeting: 'all'
  });
      fetchAds();
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save ad.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ad_campaigns', id));
      setAdToDelete(null);
      fetchAds();
    } catch (error) {
      console.error("Error deleting ad:", error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ad_campaigns', id), { isActive: !currentStatus });
      setAds(ads.map(ad => ad.id === id ? { ...ad, isActive: !currentStatus } : ad));
    } catch (error) {
      console.error("Error toggling ad status:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-netflix-surface p-6 rounded-lg border border-gray-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-netflix-red" /> Ad Campaigns</h2>
          <p className="text-sm text-gray-400 mt-1">Manage hybrid ad zones across the platform.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentAd({
              campaignName: '',
              type: 'direct',
              zones: ['home-top'],
              imageUrl: '',
              targetUrl: '',
              isActive: true,
              displayFrequency: 1,
    deviceTargeting: 'all'
  });
            setIsEditing(true);
          }}
          className="bg-netflix-red text-white px-4 py-2 rounded-md font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Campaign
        </button>
      </div>

      {isEditing && (
        <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800 space-y-4">
          <h3 className="text-lg font-bold mb-4">{currentAd.id ? 'Edit Campaign' : 'New Campaign'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Campaign Name</label>
              <input 
                type="text" 
                value={currentAd.campaignName} 
                onChange={e => setCurrentAd({...currentAd, campaignName: e.target.value})}
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
                placeholder="e.g., Summer Sale 2026"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Zones (Hold Ctrl/Cmd to select multiple)</label>
              <select 
                multiple
                value={currentAd.zones || []} 
                onChange={e => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) {
                      selected.push(options[i].value);
                    }
                  }
                  setCurrentAd({...currentAd, zones: selected});
                }}
                className="w-full h-48 bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
              >
                                <option value="home-top">Home - Top</option>
                <option value="home-row-1">Home - After Top 10</option>
                <option value="home-row-2">Home - After Latest Releases</option>
                <option value="home-row-3">Home - After Trending</option>
                <option value="home-row-4">Home - After Action</option>
                <option value="home-bottom">Home - Bottom</option>
                <option value="explore-top">Explore - Top</option>
                <option value="explore-middle-1">Explore - Middle 1</option>
                <option value="explore-middle-2">Explore - Middle 2</option>
                <option value="explore-bottom">Explore - Bottom</option>
                <option value="subtitle-details-top">Subtitle Details - Top</option>
                <option value="subtitle-details-content-1">Subtitle Details - Content 1</option>
                <option value="subtitle-details-content-2">Subtitle Details - Content 2</option>
                <option value="subtitle-details-content-3">Subtitle Details - Content 3</option>
                <option value="subtitle-details-content-4">Subtitle Details - Content 4</option>
                <option value="subtitle-details-middle">Subtitle Details - Middle</option>
                <option value="subtitle-details">Subtitle Details (Download Area)</option>
                <option value="subtitle-details-bottom">Subtitle Details - Bottom</option>
                <option value="series-details-top">Series Details - Top</option>
                <option value="series-details-middle">Series Details - Middle</option>
                <option value="series-details">Series Details (Episodes)</option>
                <option value="series-details-bottom">Series Details - Bottom</option>
                <option value="download-popup">Download Pop-up</option>
                <option value="faq-top">FAQ - Top</option>
                <option value="faq-bottom">FAQ - Bottom</option>
                <option value="top-subtitlers-top">Top Subtitlers - Top</option>
                <option value="top-subtitlers-bottom">Top Subtitlers - Bottom</option>
                                <option value="global-header">Global - Header</option>
                <option value="global-footer">Global - Footer</option>
                <option value="video-downloads-top">Video Downloads - Top</option>
                <option value="video-downloads-middle">Video Downloads - Middle</option>
                <option value="video-downloads-bottom">Video Downloads - Bottom</option>
                <option value="public-profile-top">Public Profile - Top</option>
                                <option value="public-profile-bottom">Public Profile - Bottom</option>
                <option value="profile-top">Profile - Top</option>
                <option value="profile-bottom">Profile - Bottom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Device Targeting</label>
            <select
              value={currentAd.deviceTargeting || 'all'}
              onChange={e => setCurrentAd({...currentAd, deviceTargeting: e.target.value as 'all' | 'desktop' | 'mobile'})}
              className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
            >
              <option value="all">All Devices</option>
              <option value="desktop">Desktop Only</option>
              <option value="mobile">Mobile Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Display Frequency</label>
            <select
              value={currentAd.displayFrequency || 1}
              onChange={e => setCurrentAd({...currentAd, displayFrequency: parseInt(e.target.value)})}
              className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
            >
              <option value={1}>Every page load (1x)</option>
              <option value={2}>Every 2nd page load</option>
              <option value={3}>Every 3rd page load</option>
              <option value={4}>Every 4th wihin zone</option>
              <option value={5}>Every 5th wihin zone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Ad Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="adType" 
                  value="direct" 
                  checked={currentAd.type === 'direct'} 
                  onChange={() => setCurrentAd({...currentAd, type: 'direct'})}
                  className="accent-netflix-red"
                />
                <span>Direct Sponsorship</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="adType" 
                  value="adsterra" 
                  checked={currentAd.type === 'adsterra'} 
                  onChange={() => setCurrentAd({...currentAd, type: 'adsterra'})}
                  className="accent-netflix-red"
                />
                <span>Adsterra Network</span>
              </label>
            </div>
          </div>

          {currentAd.type === 'direct' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Image URL</label>
                <input 
                  type="text" 
                  value={currentAd.imageUrl} 
                  onChange={e => setCurrentAd({...currentAd, imageUrl: e.target.value})}
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Target URL</label>
                <input 
                  type="text" 
                  value={currentAd.targetUrl} 
                  onChange={e => setCurrentAd({...currentAd, targetUrl: e.target.value})}
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
                  placeholder="https://sponsor.com"
                />
              </div>
            </div>
          )}

          {currentAd.type === 'adsterra' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Adsterra Format</label>
              <select
                value={currentAd.format || 'native'}
                onChange={e => setCurrentAd({...currentAd, format: e.target.value as any})}
                className="w-full bg-black border border-gray-700 rounded-md px-4 py-2 text-white focus:border-white focus:outline-none"
              >
                <option value="native">Native Banner (Responsive)</option>
                <option value="160x600">160x600 Vertical Banner</option>
                <option value="160x300">160x300 Vertical Banner</option>
                <option value="320x50">320x50 Mobile Banner</option>
                <option value="728x90">728x90 Horizontal Banner</option>
                <option value="300x250">300x250 Square Banner</option>
                <option value="468x60">468x60 Horizontal Banner</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="isActive"
              checked={currentAd.isActive}
              onChange={e => setCurrentAd({...currentAd, isActive: e.target.checked})}
              className="accent-netflix-red w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-white cursor-pointer">Active Campaign</label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-md font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="bg-netflix-red text-white px-6 py-2 rounded-md font-bold hover:bg-red-700 transition-colors"
            >
              Save Campaign
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-netflix-surface p-12 rounded-lg border border-gray-800 text-center">
          <LayoutTemplate className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No Ad Campaigns</h3>
          <p className="text-gray-500 mt-2">Create your first campaign to start monetizing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map(ad => (
            <div key={ad.id} className={`bg-netflix-surface rounded-lg border ${ad.isActive ? 'border-gray-700' : 'border-gray-800 opacity-60'} overflow-hidden flex flex-col`}>
              {ad.type === 'direct' && ad.imageUrl ? (
                <div className="h-32 w-full bg-black relative">
                  <img src={ad.imageUrl} alt={ad.campaignName} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-white/20">
                    Direct
                  </div>
                </div>
              ) : (
                <div className="h-32 w-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center relative">
                  <span className="text-2xl font-black text-gray-700 tracking-widest">ADSTERRA</span>
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-white/20 text-blue-400">
                    Network
                  </div>
                </div>
              )}
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1" title={ad.campaignName}>{ad.campaignName}</h3>
                  <button 
                    onClick={() => toggleActive(ad.id, ad.isActive)}
                    className={`text-xs px-2 py-1 rounded-full font-bold ${ad.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-700 text-gray-400'}`}
                  >
                    {ad.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
                
                <div className="flex flex-col gap-2 text-xs text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Zone: <span className="text-white font-mono bg-white/10 px-1.5 rounded truncate">{ad.zones?.join(', ') || ad.zone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Device:</span> 
                    <span className="text-white font-mono bg-white/10 px-1.5 rounded uppercase text-[10px]">
                      {ad.deviceTargeting || 'all'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-gray-800">
                  <button 
                    onClick={() => {
                      setCurrentAd(ad);
                      setIsEditing(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setAdToDelete(ad.id)}
                    className="p-2 text-gray-400 hover:text-netflix-red hover:bg-red-500/10 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {adToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-netflix-surface border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Delete Ad Campaign</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this ad campaign? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setAdToDelete(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(adToDelete)}
                className="px-4 py-2 bg-netflix-red text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
