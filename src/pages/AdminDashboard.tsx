import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, updateDoc, doc, where, deleteDoc, writeBatch, getDoc, setDoc, increment } from 'firebase/firestore';
import { AdCampaign, Application, Withdrawal, UserData, Subtitle, Report, SubtitleRequest } from '../types';
import { Link } from 'wouter';
import { 
  CheckCircle, XCircle, DollarSign, Crown, Users, FileText, Edit, Trash2, 
  Search, Filter, ChevronDown, ChevronUp, ArrowUpDown, Trash, Check,
  ChevronRight, MoreVertical, CheckSquare, Square, Flag, AlertTriangle, ExternalLink,
  MessageSquare, Clock, CheckCircle2, Film, Tv, Plus
} from 'lucide-react';
import { EditSubtitleModal } from '../components/EditSubtitleModal';
import { AdManager } from '../components/AdManager';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';

export const AdminDashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'withdrawals' | 'users' | 'subtitles' | 'reports' | 'requests' | 'settings' | 'ads'>('applications');
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [requests, setRequests] = useState<SubtitleRequest[]>([]);
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [monetizationEnabled, setMonetizationEnabled] = useState(false);
  const [popunderEnabled, setPopunderEnabled] = useState(true);
  const [socialBarEnabled, setSocialBarEnabled] = useState(true);
  const [smartlinkEnabled, setSmartlinkEnabled] = useState(true);
  const [vastVideoEnabled, setVastVideoEnabled] = useState(true);
  const [globalAdFrequency, setGlobalAdFrequency] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };
  
  const [editingSubtitle, setEditingSubtitle] = useState<Subtitle | null>(null);
  const [subtitleToDelete, setSubtitleToDelete] = useState<string | null>(null);

  // Subtitles Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedSubtitles, setSelectedSubtitles] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'downloadCount' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);

  // Distribution State
  const [adRevenueAmount, setAdRevenueAmount] = useState<string>('');
  const [proPoolAmount, setProPoolAmount] = useState<string>('');
  const [distributingAd, setDistributingAd] = useState(false);
  const [distributingPro, setDistributingPro] = useState(false);
  const [showAdConfirm, setShowAdConfirm] = useState(false);
  const [showProConfirm, setShowProConfirm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (!user || userData?.role !== 'admin') return;

    const fetchData = async () => {
      try {
        const appsQuery = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
        const appsSnap = await getDocs(appsQuery);
        setApplications(appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));

        const withdrawalsQuery = query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'));
        const withdrawalsSnap = await getDocs(withdrawalsQuery);
        setWithdrawals(withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));

        const usersQuery = query(collection(db, 'users'));
        const usersSnap = await getDocs(usersQuery);
        setUsers(usersSnap.docs.map(doc => ({ ...doc.data() } as UserData)));
        
        const subsQuery = query(collection(db, 'subtitles'), orderBy('createdAt', 'desc'));
        const subsSnap = await getDocs(subsQuery);
        setSubtitles(subsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subtitle)));

        const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
        const reportsSnap = await getDocs(reportsQuery);
        setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));

        const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
        const requestsSnap = await getDocs(requestsQuery);
        const fetchedRequests = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubtitleRequest));
        // Sort by isPro first, then by createdAt
        const sortedRequests = fetchedRequests.sort((a, b) => {
          if (a.isPro === b.isPro) return 0;
          return a.isPro ? -1 : 1;
        });
        setRequests(sortedRequests);

        const adsQuery = query(collection(db, 'ad_campaigns'), orderBy('createdAt', 'desc'));
        const adsSnap = await getDocs(adsQuery);
        setAdCampaigns(adsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign)));

        const monetizationDoc = await getDoc(doc(db, 'settings', 'monetization'));
        if (monetizationDoc.exists()) {
          setMonetizationEnabled(monetizationDoc.data().enabled);
        }

        const globalAdsDoc = await getDoc(doc(db, 'settings', 'global_ads'));
        if (globalAdsDoc.exists()) {
          const data = globalAdsDoc.data();
          setPopunderEnabled(data.popunder !== false);
          setSocialBarEnabled(data.socialBar !== false);
          setSmartlinkEnabled(data.smartlink !== false);
          setVastVideoEnabled(data.vastVideo !== false);
          setGlobalAdFrequency(data.displayFrequency || 1);
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userData]);

  const handleApproveMonetization = async (userId: string) => {
    const userToApprove = users.find(u => u.uid === userId);
    if (!userToApprove) return;
    
    if ((userToApprove.totalUploads || 0) < 10 || (userToApprove.totalDownloads || 0) < 500) {
      showMessage("User does not meet the eligibility criteria (10 uploads, 500 downloads).", 'error');
      return;
    }

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), { 
        monetizationStatus: 'approved',
        isEligibleForMonetization: true 
      });
      
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: userId,
        title: 'Monetization Approved',
        message: 'Congratulations! Your monetization request has been approved. You can now earn from your subtitles.',
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      setUsers(usrs => usrs.map(u => u.uid === userId ? { ...u, monetizationStatus: 'approved', isEligibleForMonetization: true } : u));
    } catch (err) {
      console.error("Error approving monetization:", err);
    }
  };

  const handleRejectMonetization = async (userId: string) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), { 
        monetizationStatus: 'locked' 
      });
      
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: userId,
        title: 'Monetization Rejected',
        message: 'Your monetization request was rejected. Please ensure you meet all quality guidelines.',
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      setUsers(usrs => usrs.map(u => u.uid === userId ? { ...u, monetizationStatus: 'locked' } : u));
    } catch (err) {
      console.error("Error rejecting monetization:", err);
    }
  };

  const handleApproveCreator = async (appId: string, userId: string) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'applications', appId), { status: 'approved' });
      batch.update(doc(db, 'users', userId), { role: 'creator' });
      
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: userId,
        title: 'Application Approved',
        message: 'Congratulations! Your creator application has been approved. You can now upload subtitles.',
        type: 'approval',
        read: false,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      
      setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: 'approved' } : app));
      setUsers(usrs => usrs.map(u => u.uid === userId ? { ...u, role: 'creator' } : u));
    } catch (err) {
      console.error("Error approving creator:", err);
    }
  };

  const handleRejectCreator = async (appId: string) => {
    try {
      const app = applications.find(a => a.id === appId);
      const batch = writeBatch(db);
      batch.update(doc(db, 'applications', appId), { status: 'rejected' });
      
      if (app) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId: app.userId,
          title: 'Application Rejected',
          message: 'We are sorry, but your creator application has been rejected at this time.',
          type: 'approval',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    } catch (err) {
      console.error("Error rejecting creator:", err);
    }
  };

  const handleMarkPaid = async (withdrawalId: string) => {
    try {
      const withdrawal = withdrawals.find(w => w.id === withdrawalId);
      const batch = writeBatch(db);
      batch.update(doc(db, 'withdrawals', withdrawalId), { status: 'paid' });
      
      if (withdrawal) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId: withdrawal.userId,
          title: 'Withdrawal Processed',
          message: `Your withdrawal request for Rs ${withdrawal.amount} has been processed and paid.`,
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      setWithdrawals(ws => ws.map(w => w.id === withdrawalId ? { ...w, status: 'paid' } : w));
    } catch (err) {
      console.error("Error marking paid:", err);
    }
  };

  const handleActivatePro = async (userId: string) => {
    try {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 days from now
      const proExpiry = date.toISOString();
      
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), { proExpiry });
      
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: userId,
        title: 'Pro Membership Activated',
        message: 'Your Pro Membership has been activated for 30 days! Enjoy ad-free direct downloads.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      });

      await batch.commit();
      setUsers(usrs => usrs.map(u => u.uid === userId ? { ...u, proExpiry } : u));
    } catch (err) {
      console.error("Error activating pro:", err);
    }
  };

  const handleDeleteSubtitle = async (subtitleId: string) => {
    setSubtitleToDelete(subtitleId);
  };

  const confirmDelete = async () => {
    if (!subtitleToDelete) return;
    try {
      const sub = subtitles.find(s => s.id === subtitleToDelete);
      const batch = writeBatch(db);
      batch.delete(doc(db, 'subtitles', subtitleToDelete));
      
      if (sub && sub.status === 'approved' && sub.authorUid) {
        batch.update(doc(db, 'users', sub.authorUid), {
          totalUploads: increment(-1)
        });
      }
      
      await batch.commit();
      setSubtitles(subs => subs.filter(s => s.id !== subtitleToDelete));
      setSelectedSubtitles(prev => prev.filter(id => id !== subtitleToDelete));
    } catch (err) {
      console.error("Error deleting subtitle:", err);
    } finally {
      setSubtitleToDelete(null);
    }
  };

  const handleSubtitleUpdate = (updatedSubtitle: Subtitle) => {
    setSubtitles(subs => subs.map(s => s.id === updatedSubtitle.id ? updatedSubtitle : s));
  };

  // --- Subtitles Table Logic ---

  const filteredSubtitles = useMemo(() => {
    return subtitles.filter(sub => {
      const matchesSearch = 
        sub.movieTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || sub.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      const valA = a[sortField] || 0;
      const valB = b[sortField] || 0;
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [subtitles, searchTerm, filterType, sortField, sortOrder]);

  const groupedSubtitles = useMemo(() => {
    const groups: any[] = [];
    const seriesMap = new Map<string, Subtitle[]>();

    filteredSubtitles.forEach(sub => {
      if (sub.type === 'series') {
        if (!seriesMap.has(sub.movieTitle)) {
          seriesMap.set(sub.movieTitle, []);
        }
        seriesMap.get(sub.movieTitle)!.push(sub);
      } else {
        groups.push({ type: 'single', item: sub });
      }
    });

    seriesMap.forEach((items, title) => {
      groups.push({ type: 'group', title, items });
    });

    // Sort groups by the latest createdAt in their items or the single item's createdAt
    return groups.sort((a, b) => {
      const timeA = a.type === 'single' ? new Date(a.item.createdAt).getTime() : Math.max(...a.items.map((i: any) => new Date(i.createdAt).getTime()));
      const timeB = b.type === 'single' ? new Date(b.item.createdAt).getTime() : Math.max(...b.items.map((i: any) => new Date(i.createdAt).getTime()));
      return timeB - timeA;
    });
  }, [filteredSubtitles]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedSubtitles.slice(start, start + itemsPerPage);
  }, [groupedSubtitles, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(groupedSubtitles.length / itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedSubtitles.length === filteredSubtitles.length) {
      setSelectedSubtitles([]);
    } else {
      setSelectedSubtitles(filteredSubtitles.map(s => s.id));
    }
  };

  const toggleSelectSubtitle = (id: string) => {
    setSelectedSubtitles(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSeriesExpansion = (title: string) => {
    setExpandedSeries(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleApproveSubtitle = async (subtitleId: string) => {
    try {
      const sub = subtitles.find(s => s.id === subtitleId);
      if (!sub) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'subtitles', subtitleId), { status: 'approved' });
      
      // Increment totalUploads for the creator
      if (sub.authorUid) {
        batch.update(doc(db, 'users', sub.authorUid), {
          totalUploads: increment(1)
        });
        
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId: sub.authorUid,
          title: 'Subtitle Approved',
          message: `Your subtitle for "${sub.movieTitle}" has been approved and is now live!`,
          type: 'approval',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/subtitles/${sub.id}`
        });
      }

      await batch.commit();
      setSubtitles(prev => prev.map(s => s.id === subtitleId ? { ...s, status: 'approved' } : s));
    } catch (err) {
      console.error("Error approving subtitle:", err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubtitles.length === 0) return;

    try {
      const batch = writeBatch(db);
      const creatorUploadsToDecrement: Record<string, number> = {};

      selectedSubtitles.forEach(id => {
        const sub = subtitles.find(s => s.id === id);
        if (sub && sub.status === 'approved' && sub.authorUid) {
          creatorUploadsToDecrement[sub.authorUid] = (creatorUploadsToDecrement[sub.authorUid] || 0) + 1;
        }
        batch.delete(doc(db, 'subtitles', id));
      });

      Object.entries(creatorUploadsToDecrement).forEach(([uid, count]) => {
        batch.update(doc(db, 'users', uid), {
          totalUploads: increment(-count)
        });
      });

      await batch.commit();
      setSubtitles(prev => prev.filter(s => !selectedSubtitles.includes(s.id)));
      setSelectedSubtitles([]);
    } catch (err) {
      console.error("Bulk delete error:", err);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedSubtitles.length === 0) return;
    
    const pendingSelected = subtitles.filter(s => selectedSubtitles.includes(s.id) && s.status === 'pending');
    if (pendingSelected.length === 0) return;

    try {
      const batch = writeBatch(db);
      const creatorUploads: Record<string, number> = {};

      pendingSelected.forEach(s => {
        batch.update(doc(db, 'subtitles', s.id), { status: 'approved' });
        if (s.authorUid) {
          creatorUploads[s.authorUid] = (creatorUploads[s.authorUid] || 0) + 1;
          
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: s.authorUid,
            title: 'Subtitle Approved',
            message: `Your subtitle for "${s.movieTitle}" has been approved and is now live!`,
            type: 'approval',
            read: false,
            createdAt: new Date().toISOString(),
            link: `/subtitles/${s.id}`
          });
        }
      });

      // Update totalUploads for each creator
      Object.entries(creatorUploads).forEach(([uid, count]) => {
        batch.update(doc(db, 'users', uid), {
          totalUploads: increment(count)
        });
      });

      await batch.commit();
      
      setSubtitles(prev => prev.map(s => 
        selectedSubtitles.includes(s.id) ? { ...s, status: 'approved' } : s
      ));
      setSelectedSubtitles([]);
    } catch (err) {
      console.error("Bulk approve error:", err);
    }
  };

  const toggleSort = (field: 'downloadCount' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleToggleMonetization = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'monetization'), {
        enabled: !monetizationEnabled,
        updatedAt: new Date().toISOString()
      });
      setMonetizationEnabled(!monetizationEnabled);
    } catch (err) {
      console.error("Error toggling monetization:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateGlobalAds = async (field: string, currentValue: boolean) => {
    setSavingSettings(true);
    const newValue = !currentValue;
    try {
      // Update state immediately for faster UI
      if (field === 'popunder') setPopunderEnabled(newValue);
      if (field === 'socialBar') setSocialBarEnabled(newValue);
      if (field === 'smartlink') setSmartlinkEnabled(newValue);
      if (field === 'vastVideo') setVastVideoEnabled(newValue);

      await setDoc(doc(db, 'settings', 'global_ads'), {
        [field]: newValue,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(`Error toggling ${field}:`, err);
      // Revert on failure
      if (field === 'popunder') setPopunderEnabled(currentValue);
      if (field === 'socialBar') setSocialBarEnabled(currentValue);
      if (field === 'smartlink') setSmartlinkEnabled(currentValue);
      if (field === 'vastVideo') setVastVideoEnabled(currentValue);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateGlobalAdFrequency = async (newFrequency: number) => {
    setSavingSettings(true);
    try {
      setGlobalAdFrequency(newFrequency);
      await setDoc(doc(db, 'settings', 'global_ads'), {
        displayFrequency: newFrequency,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Error updating frequency:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (err) {
      console.error("Error resolving report:", err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: SubtitleRequest['status']) => {
    try {
      const req = requests.find(r => r.id === requestId);
      const batch = writeBatch(db);
      batch.update(doc(db, 'requests', requestId), { status });
      
      if (req && status !== 'pending') {
        const notifRef = doc(collection(db, 'notifications'));
        let message = '';
        if (status === 'in_progress') message = `Your request for "${req.title}" is now in progress!`;
        if (status === 'completed') message = `Your request for "${req.title}" has been completed!`;
        if (status === 'rejected') message = `Your request for "${req.title}" was rejected.`;
        
        batch.set(notifRef, {
          userId: req.userId,
          title: 'Subtitle Request Update',
          message,
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, 'requests', requestId));
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error("Error deleting request:", err);
    }
  };

  const handleDistributeAdRevenue = async () => {
    if (!adRevenueAmount || isNaN(Number(adRevenueAmount)) || Number(adRevenueAmount) <= 0) return;
    setDistributingAd(true);
    try {
      const eligibleCreators = users.filter(u => 
        u.monetizationStatus === 'approved' && 
        (u.totalUploads || 0) >= 10 && 
        (u.totalDownloads || 0) >= 500
      );
      if (eligibleCreators.length === 0) {
        showMessage("No eligible creators found.", 'error');
        setDistributingAd(false);
        setShowAdConfirm(false);
        return;
      }

      const downloadsQuery = query(collection(db, 'downloads'), where('adPaidStatus', '==', 'unpaid'));
      const downloadsSnap = await getDocs(downloadsQuery);
      
      const eligibleCreatorIds = new Set(eligibleCreators.map(c => c.uid));
      
      let totalEligibleDownloads = 0;
      const creatorDownloadCounts: Record<string, number> = {};
      const downloadDocsToUpdate: string[] = [];

      downloadsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (eligibleCreatorIds.has(data.creatorId)) {
          totalEligibleDownloads++;
          creatorDownloadCounts[data.creatorId] = (creatorDownloadCounts[data.creatorId] || 0) + 1;
          downloadDocsToUpdate.push(doc.id);
        }
      });

      if (totalEligibleDownloads === 0) {
        showMessage("No unpaid downloads found for eligible creators.", 'error');
        setDistributingAd(false);
        setShowAdConfirm(false);
        return;
      }

      const totalAmount = Number(adRevenueAmount);
      const batch = writeBatch(db);

      eligibleCreators.forEach(creator => {
        const downloads = creatorDownloadCounts[creator.uid] || 0;
        if (downloads > 0) {
          const share = (downloads / totalEligibleDownloads) * totalAmount;
          const creatorRef = doc(db, 'users', creator.uid);
          batch.update(creatorRef, {
            walletBalance: increment(share)
          });
        }
      });

      const chunks = [];
      for (let i = 0; i < downloadDocsToUpdate.length; i += 400) {
        chunks.push(downloadDocsToUpdate.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const chunkBatch = writeBatch(db);
        chunk.forEach(id => {
          chunkBatch.update(doc(db, 'downloads', id), { adPaidStatus: 'paid' });
        });
        await chunkBatch.commit();
      }

      await batch.commit();
      
      showMessage("Ad revenue distributed successfully!", 'success');
      setAdRevenueAmount('');
      setShowAdConfirm(false);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData)));
      
    } catch (err) {
      console.error("Error distributing ad revenue:", err);
      showMessage("Failed to distribute ad revenue.", 'error');
    } finally {
      setDistributingAd(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showMessage("Please enter both title and message.", 'error');
      return;
    }
    setSendingBroadcast(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      
      usersSnap.docs.forEach(userDoc => {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId: userDoc.id,
          title: broadcastTitle,
          message: broadcastMessage,
          type: 'general',
          read: false,
          createdAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      showMessage("Broadcast notification sent to all users!", 'success');
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error("Error sending broadcast:", err);
      showMessage("Failed to send broadcast notification.", 'error');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDistributeProRevenue = async () => {
    if (!proPoolAmount || isNaN(Number(proPoolAmount)) || Number(proPoolAmount) <= 0) return;
    setDistributingPro(true);
    try {
      const eligibleCreators = users.filter(u => 
        u.monetizationStatus === 'approved' && 
        (u.totalUploads || 0) >= 10 && 
        (u.totalDownloads || 0) >= 500
      );
      if (eligibleCreators.length === 0) {
        showMessage("No eligible creators found.", 'error');
        setDistributingPro(false);
        setShowProConfirm(false);
        return;
      }

      const downloadsQuery = query(
        collection(db, 'downloads'), 
        where('proPaidStatus', '==', 'unpaid'),
        where('isProDownload', '==', true)
      );
      const downloadsSnap = await getDocs(downloadsQuery);
      
      const eligibleCreatorIds = new Set(eligibleCreators.map(c => c.uid));
      
      let totalProDownloads = 0;
      const creatorProDownloadCounts: Record<string, number> = {};
      const downloadDocsToUpdate: string[] = [];

      downloadsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (eligibleCreatorIds.has(data.creatorId)) {
          totalProDownloads++;
          creatorProDownloadCounts[data.creatorId] = (creatorProDownloadCounts[data.creatorId] || 0) + 1;
          downloadDocsToUpdate.push(doc.id);
        }
      });

      if (totalProDownloads === 0) {
        showMessage("No unpaid Pro downloads found for eligible creators.", 'error');
        setDistributingPro(false);
        setShowProConfirm(false);
        return;
      }

      const totalAmount = Number(proPoolAmount);
      const batch = writeBatch(db);

      eligibleCreators.forEach(creator => {
        const downloads = creatorProDownloadCounts[creator.uid] || 0;
        if (downloads > 0) {
          const share = (downloads / totalProDownloads) * totalAmount;
          const creatorRef = doc(db, 'users', creator.uid);
          batch.update(creatorRef, {
            walletBalance: increment(share)
          });
        }
      });

      const chunks = [];
      for (let i = 0; i < downloadDocsToUpdate.length; i += 400) {
        chunks.push(downloadDocsToUpdate.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const chunkBatch = writeBatch(db);
        chunk.forEach(id => {
          chunkBatch.update(doc(db, 'downloads', id), { proPaidStatus: 'paid' });
        });
        await chunkBatch.commit();
      }

      await batch.commit();
      
      showMessage("Pro pool revenue distributed successfully!", 'success');
      setProPoolAmount('');
      setShowProConfirm(false);
      
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData)));
      
    } catch (err) {
      console.error("Error distributing pro revenue:", err);
      showMessage("Failed to distribute pro revenue.", 'error');
    } finally {
      setDistributingPro(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-netflix-bg flex items-center justify-center"><div className="w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full animate-spin"></div></div>;

  if (userData?.role !== 'admin') {
    return <div className="min-h-screen bg-netflix-bg text-white flex items-center justify-center">Access Denied. You must be an admin.</div>;
  }

  return (
    <div className="min-h-screen bg-netflix-bg text-white pt-24 pb-12 px-4 md:px-12">
      <Helmet>
        <title>Admin Dashboard - LAKSUB</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <img src="/logo.png" alt="LAKSUB" className="h-8 w-auto" referrerPolicy="no-referrer" />
          Admin Dashboard
        </h1>

        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-md font-medium ${message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-red-900/50 text-red-400 border border-red-800'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex gap-4 mb-8 border-b border-gray-800 pb-4 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'applications' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Creator Applications
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'withdrawals' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Withdrawals
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'users' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Manage Users
          </button>
          <button onClick={() => setActiveTab('subtitles')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'subtitles' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Manage Subtitles
          </button>
          <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'reports' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Reports {reports.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-1 bg-netflix-red text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'requests' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Requests {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-1 bg-netflix-red text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('ads')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'ads' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Ad Manager
          </button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Global Settings
          </button>
        </div>

        {activeTab === 'applications' && (
          <div className="space-y-8">
            <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5" /> Pending Creator Applications</h2>
              {applications.filter(a => a.status === 'pending').length === 0 ? (
                <p className="text-gray-500">No pending creator applications.</p>
              ) : (
                <div className="space-y-4">
                  {applications.filter(a => a.status === 'pending').map(app => (
                    <div key={app.id} className="bg-black/50 p-4 rounded-md border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <Link href={`/user/${app.userId}`} className="font-bold text-lg hover:text-netflix-red transition-colors">{app.userName}</Link>
                        <p className="text-sm text-gray-400 mt-1">{app.message}</p>
                        {app.contactInfo && (
                          <p className="text-sm text-blue-400 mt-1 font-medium">Contact: {app.contactInfo}</p>
                        )}                        <p className="text-xs text-gray-500 mt-2">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => handleApproveCreator(app.id, app.userId)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleRejectCreator(app.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Pending Monetization Requests</h2>
              {users.filter(u => u.monetizationStatus === 'pending_review').length === 0 ? (
                <p className="text-gray-500">No pending monetization requests.</p>
              ) : (
                <div className="space-y-4">
                  {users.filter(u => u.monetizationStatus === 'pending_review').map(u => (
                    <div key={u.uid} className="bg-black/50 p-4 rounded-md border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <Link href={`/user/${u.uid}`} className="font-bold text-lg hover:text-netflix-red transition-colors">{u.displayName}</Link>
                        <p className="text-sm text-gray-400 mt-1">{u.email}</p>
                        <div className="flex gap-4 mt-2">                          <p className="text-xs text-gray-500">Uploads: <span className="text-white">{u.totalUploads || 0}</span></p>
                          <p className="text-xs text-gray-500">Downloads: <span className="text-white">{u.totalDownloads || 0}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => handleApproveMonetization(u.uid)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleRejectMonetization(u.uid)} className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Pending Withdrawals</h2>
            {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
              <p className="text-gray-500">No pending withdrawals.</p>
            ) : (
              <div className="space-y-4">
                {withdrawals.filter(w => w.status === 'pending').map(w => (
                  <div key={w.id} className="bg-black/50 p-4 rounded-md border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <Link href={`/user/${w.userId}`} className="font-bold text-lg hover:text-netflix-red transition-colors">{w.userName}</Link>
                      <p className="text-xl text-green-400 font-bold mt-1">{w.amount.toLocaleString()} LKR</p>
                      <p className="text-xs text-gray-500 mt-2">Requested: {new Date(w.requestedAt).toLocaleDateString()}</p>
                    </div>                    <button onClick={() => handleMarkPaid(w.id)} className="w-full md:w-auto flex items-center justify-center gap-1 bg-netflix-red hover:bg-red-700 text-white px-6 py-2 rounded-md font-bold transition-colors">
                      Mark as Paid
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Crown className="w-5 h-5" /> Manage Users & Pro Status</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Age Verified</th>
                    <th className="pb-3 font-medium">Pro Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isPro = u.proExpiry ? new Date(u.proExpiry) > new Date() : false;
                    return (
                      <tr key={u.uid} className="border-b border-gray-800/50">
                        <td className="py-4 font-medium">
                          <Link href={`/user/${u.uid}`} className="hover:text-netflix-red transition-colors">{u.displayName}</Link>
                        </td>
                        <td className="py-4 text-gray-400">{u.email}</td>                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-900/50 text-red-400' : u.role === 'creator' ? 'bg-blue-900/50 text-blue-400' : 'bg-gray-800 text-gray-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4">
                          {u.isAdultVerified ? (
                            <span className="text-green-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> 18+ Verified
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs uppercase tracking-wider">Not Verified</span>
                          )}
                        </td>
                        <td className="py-4">
                          {isPro ? (
                            <span className="text-yellow-500 font-bold text-xs uppercase tracking-wider">Active (Expires {new Date(u.proExpiry!).toLocaleDateString()})</span>
                          ) : (
                            <span className="text-gray-500 text-xs uppercase tracking-wider">Free</span>
                          )}
                        </td>
                        <td className="py-4">
                          {!isPro && (
                            <button onClick={() => handleActivatePro(u.uid)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-wider hover:from-yellow-400 hover:to-yellow-500 transition-colors">
                              Activate Pro (30 Days)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subtitles' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-netflix-surface p-4 rounded-lg border border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search title or creator..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm focus:border-netflix-red focus:outline-none transition-colors"
                />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full bg-black border border-gray-700 rounded-md pl-10 pr-8 py-2 text-sm appearance-none focus:border-netflix-red focus:outline-none transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="movie">Movies</option>
                    <option value="series">Series</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
              {selectedSubtitles.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-netflix-red p-4 rounded-lg flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{selectedSubtitles.length} selected</span>
                    <button 
                      onClick={() => setSelectedSubtitles([])}
                      className="text-sm underline hover:no-underline"
                    >
                      Deselect all
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleBulkApprove}
                      className="bg-white text-green-600 px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve Selected
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="bg-white text-netflix-red px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <Trash className="w-4 h-4" /> Delete Selected
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtitles Table */}
            <div className="bg-netflix-surface rounded-lg border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800 bg-black/20">
                      <th className="p-4 w-10">
                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors">
                          {selectedSubtitles.length === filteredSubtitles.length && filteredSubtitles.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-netflix-red" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Creator</th>
                      <th 
                        className="p-4 font-medium cursor-pointer hover:text-white transition-colors group"
                        onClick={() => toggleSort('downloadCount')}
                      >
                        <div className="flex items-center gap-1">
                          Downloads
                          {sortField === 'downloadCount' ? (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-netflix-red" /> : <ChevronDown className="w-4 h-4 text-netflix-red" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 font-medium cursor-pointer hover:text-white transition-colors group"
                        onClick={() => toggleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Date
                          {sortField === 'createdAt' ? (
                            sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-netflix-red" /> : <ChevronDown className="w-4 h-4 text-netflix-red" />
                          ) : (
                            <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedGroups.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-500 italic">
                          No subtitles found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedGroups.map((group, idx) => (
                        <React.Fragment key={group.type === 'single' ? group.item.id : group.title}>
                          {group.type === 'single' ? (
                            <tr className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <button onClick={() => toggleSelectSubtitle(group.item.id)} className="text-gray-400 hover:text-white transition-colors">
                                  {selectedSubtitles.includes(group.item.id) ? (
                                    <CheckSquare className="w-5 h-5 text-netflix-red" />
                                  ) : (
                                    <Square className="w-5 h-5" />
                                  )}
                                </button>
                              </td>
                              <td className="p-4 font-medium">
                                {group.item.movieTitle}
                                {group.item.isAdult && (
                                  <span className="ml-2 bg-red-600 text-white text-[8px] px-1 rounded font-black">18+</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] uppercase font-bold rounded">
                                  {group.item.type}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${group.item.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                  {group.item.status}
                                </span>
                              </td>
                              <td className="p-4 text-gray-400">
                                <Link href={`/user/${group.item.authorUid}`} className="hover:text-netflix-red transition-colors">{group.item.authorName}</Link>
                              </td>
                              <td className="p-4 text-gray-400">{group.item.downloadCount || 0}</td>
                              <td className="p-4 text-gray-400">{new Date(group.item.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  {group.item.status === 'pending' && (
                                    <button 
                                      onClick={() => handleApproveSubtitle(group.item.id)} 
                                      className="p-2 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-all"
                                      title="Approve Subtitle"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => setEditingSubtitle(group.item)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteSubtitle(group.item.id)} className="p-2 text-gray-400 hover:text-netflix-red hover:bg-netflix-red/10 rounded-md transition-all">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <>
                              <tr 
                                className={`border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer ${expandedSeries.includes(group.title) ? 'bg-white/5' : ''}`}
                                onClick={() => toggleSeriesExpansion(group.title)}
                              >
                                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={() => {
                                      const allIds = group.items.map((i: any) => i.id);
                                      const allSelected = allIds.every((id: string) => selectedSubtitles.includes(id));
                                      if (allSelected) {
                                        setSelectedSubtitles(prev => prev.filter(id => !allIds.includes(id)));
                                      } else {
                                        setSelectedSubtitles(prev => [...new Set([...prev, ...allIds])]);
                                      }
                                    }} 
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    {group.items.every((i: any) => selectedSubtitles.includes(i.id)) ? (
                                      <CheckSquare className="w-5 h-5 text-netflix-red" />
                                    ) : group.items.some((i: any) => selectedSubtitles.includes(i.id)) ? (
                                      <CheckSquare className="w-5 h-5 text-netflix-red/50" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>
                                </td>
                                <td className="p-4 font-bold flex items-center gap-2">
                                  <ChevronRight className={`w-4 h-4 transition-transform ${expandedSeries.includes(group.title) ? 'rotate-90' : ''}`} />
                                  {group.title}
                                  {group.items.some((i: any) => i.isAdult) && (
                                    <span className="bg-red-600 text-white text-[8px] px-1 rounded font-black">18+</span>
                                  )}
                                  <span className="text-[10px] bg-netflix-red px-1.5 py-0.5 rounded-full text-white ml-2">
                                    {group.items.length} Episodes
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] uppercase font-bold rounded">
                                    Series
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${group.items.every((i: any) => i.status === 'approved') ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                    {group.items.every((i: any) => i.status === 'approved') ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4 text-gray-400">Multiple</td>
                                <td className="p-4 text-gray-400">
                                  {group.items.reduce((sum: number, i: any) => sum + (i.downloadCount || 0), 0)}
                                </td>
                                <td className="p-4 text-gray-400">
                                  {new Date(Math.max(...group.items.map((i: any) => new Date(i.createdAt).getTime()))).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                  <span className="text-xs text-gray-500">Click to expand</span>
                                </td>
                              </tr>
                              <AnimatePresence>
                                {expandedSeries.includes(group.title) && (
                                  group.items.map((sub: Subtitle) => (
                                    <motion.tr 
                                      key={sub.id}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="bg-black/40 border-b border-gray-800/30"
                                    >
                                      <td className="p-4 pl-8">
                                        <button onClick={() => toggleSelectSubtitle(sub.id)} className="text-gray-400 hover:text-white transition-colors">
                                          {selectedSubtitles.includes(sub.id) ? (
                                            <CheckSquare className="w-5 h-5 text-netflix-red" />
                                          ) : (
                                            <Square className="w-5 h-5" />
                                          )}
                                        </button>
                                      </td>
                                      <td className="p-4 pl-12 text-gray-300 italic">
                                        S{sub.season?.toString().padStart(2, '0')} E{sub.episode?.toString().padStart(2, '0')}
                                        {sub.isAdult && (
                                          <span className="ml-2 bg-red-600 text-white text-[8px] px-1 rounded font-black">18+</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-gray-500 text-xs">Episode</td>
                                      <td className="p-4">
                                        <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${sub.status === 'approved' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                          {sub.status}
                                        </span>
                                      </td>
                                      <td className="p-4 text-gray-400">
                                        <Link href={`/user/${sub.authorUid}`} className="hover:text-netflix-red transition-colors">{sub.authorName}</Link>
                                      </td>
                                      <td className="p-4 text-gray-400">{sub.downloadCount || 0}</td>
                                      <td className="p-4 text-gray-400">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                      <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                          {sub.status === 'pending' && (
                                            <button 
                                              onClick={() => handleApproveSubtitle(sub.id)} 
                                              className="p-2 text-green-500 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-all"
                                              title="Approve Episode"
                                            >
                                              <CheckCircle className="w-3 h-3" />
                                            </button>
                                          )}
                                          <button onClick={() => setEditingSubtitle(sub)} className="p-2 text-gray-400 hover:text-white transition-all">
                                            <Edit className="w-3 h-3" />
                                          </button>
                                          <button onClick={() => handleDeleteSubtitle(sub.id)} className="p-2 text-gray-400 hover:text-netflix-red transition-all">
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </td>
                                    </motion.tr>
                                  ))
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="p-4 bg-black/40 border-t border-gray-800 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="text-white font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, groupedSubtitles.length)}</span> to <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, groupedSubtitles.length)}</span> of <span className="text-white font-bold">{groupedSubtitles.length}</span> groups
                </div>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Flag className="w-5 h-5 text-netflix-red" /> Subtitle Reports</h2>
            {reports.length === 0 ? (
              <p className="text-gray-500">No reports found.</p>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div key={report.id} className={`bg-black/50 p-4 rounded-md border ${report.status === 'pending' ? 'border-netflix-red/30' : 'border-gray-800'} flex flex-col gap-4`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                            report.reason === 'broken_link' ? 'bg-red-900/30 text-red-400' :
                            report.reason === 'inappropriate' ? 'bg-orange-900/30 text-orange-400' :
                            'bg-blue-900/30 text-blue-400'
                          }`}>
                            {report.reason.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                            report.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {report.subtitleTitle}
                          <a 
                            href={`/subtitles/${report.subtitleId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </h3>
                        <p className="text-sm text-gray-400 mt-2 italic">"{report.message}"</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>Reported by: <Link href={`/user/${report.userId}`} className="hover:text-netflix-red transition-colors">{report.userName}</Link></p>
                        <p>{new Date(report.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end border-t border-gray-800 pt-3">
                      {report.status === 'pending' && (
                        <button 
                          onClick={() => handleResolveReport(report.id!)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteReport(report.id!)}
                        className="flex items-center gap-1 bg-gray-800 hover:bg-red-900 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-netflix-surface p-6 rounded-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Subtitle Requests</h2>
            {requests.length === 0 ? (
              <p className="text-gray-500">No subtitle requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="pb-3 font-medium">Content</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr 
                        key={req.id} 
                        className={`border-b border-gray-800/50 hover:bg-white/5 transition-colors ${
                          req.isPro && req.status === 'pending' ? 'bg-netflix-red/5' : ''
                        }`}
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {req.type === 'movie' ? <Film className="w-4 h-4 text-gray-500" /> : <Tv className="w-4 h-4 text-gray-500" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold">{req.title}</p>
                                {req.isPro && (
                                  <span className="flex items-center gap-0.5 text-[8px] font-black bg-netflix-red text-white px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">
                                    <Crown className="w-2 h-2" /> Priority
                                  </span>
                                )}
                              </div>
                              {req.year && <p className="text-[10px] text-gray-500">Year: {req.year}</p>}
                              {req.additionalInfo && <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1" title={req.additionalInfo}>{req.additionalInfo}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Link href={`/user/${req.userId}`} className="font-medium hover:text-netflix-red transition-colors">{req.userName}</Link>
                          {req.isPro && <span className="text-[8px] font-black bg-yellow-500 text-black px-1 rounded uppercase tracking-tighter ml-1">Pro</span>}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                            req.status === 'completed' ? 'bg-green-900/30 text-green-400' : 
                            req.status === 'in_progress' ? 'bg-blue-900/30 text-blue-400' : 
                            req.status === 'rejected' ? 'bg-red-900/30 text-red-400' : 
                            'bg-yellow-900/30 text-yellow-400'
                          }`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {req.status === 'pending' && (
                              <button 
                                onClick={() => handleUpdateRequestStatus(req.id, 'in_progress')}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md transition-all"
                                title="Mark In Progress"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                            {req.status !== 'completed' && (
                              <button 
                                onClick={() => handleUpdateRequestStatus(req.id, 'completed')}
                                className="p-2 text-green-500 hover:bg-green-500/10 rounded-md transition-all"
                                title="Mark Completed"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {req.status !== 'rejected' && (
                              <button 
                                onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                title="Reject Request"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-2 text-gray-500 hover:text-netflix-red hover:bg-netflix-red/10 rounded-md transition-all"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ads' && (
          <AdManager />
        )}

        {activeTab === 'settings' && (
          <div className="bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-xl p-8 rounded-2xl border border-white/5 max-w-3xl shadow-2xl">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
              <DollarSign className="w-6 h-6 text-netflix-red" /> Global Settings
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm shadow-inner">
                <div>
                  <h3 className="font-bold text-lg text-white">Monetization</h3>
                  <p className="text-sm text-gray-400 mt-1">Enable or disable creator earnings and withdrawals.</p>
                </div>
                <button 
                  onClick={handleToggleMonetization}
                  disabled={savingSettings}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none shadow-inner ${monetizationEnabled ? 'bg-netflix-red' : 'bg-gray-700'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${monetizationEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="p-5 bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-500/50 rounded-r-xl">
                <p className="text-sm text-yellow-200/90 leading-relaxed">
                  <strong className="text-yellow-500">Note:</strong> Disabling monetization will prevent creators from earning for new downloads and hide wallet features in their dashboards. Existing balances will be preserved.
                </p>
              </div>

              {/* Global Ads Controls */}
              <div className="p-6 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-white">Global Ad Formats</h3>
                  <p className="text-sm text-gray-400 mt-1">Control which Adsterra global formats are shown to free users.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
                    <div>
                      <h4 className="font-bold text-white">Ad Display Frequency</h4>
                      <p className="text-xs text-gray-500 mt-1">Show ads every X page loads to reduce clutter.</p>
                    </div>
                    <select
                      value={globalAdFrequency}
                      onChange={(e) => handleUpdateGlobalAdFrequency(Number(e.target.value))}
                      disabled={savingSettings}
                      className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-1.5 focus:outline-none focus:border-netflix-red"
                    >
                      <option value={1}>Every page load (1x)</option>
                      <option value={2}>Every 2nd page load</option>
                      <option value={3}>Every 3rd page load</option>
                      <option value={4}>Every 4th page load</option>
                      <option value={5}>Every 5th page load</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
                    <div>
                      <h4 className="font-bold text-white">Popunder (Vignette)</h4>
                      <p className="text-xs text-gray-500 mt-1">Displays a full page ad behind the main window.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateGlobalAds('popunder', popunderEnabled)}
                      disabled={savingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${popunderEnabled ? 'bg-netflix-red' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${popunderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
                    <div>
                      <h4 className="font-bold text-white">Social Bar</h4>
                      <p className="text-xs text-gray-500 mt-1">Displays push-like notifications and banners.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateGlobalAds('socialBar', socialBarEnabled)}
                      disabled={savingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${socialBarEnabled ? 'bg-netflix-red' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${socialBarEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
                    <div>
                      <h4 className="font-bold text-white">Smartlink on Downloads</h4>
                      <p className="text-xs text-gray-500 mt-1">Opens affiliate ad links when free users download subtitles or click watch online.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateGlobalAds('smartlink', smartlinkEnabled)}
                      disabled={savingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${smartlinkEnabled ? 'bg-netflix-red' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${smartlinkEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5">
                    <div>
                      <h4 className="font-bold text-white">VAST Video Ad</h4>
                      <p className="text-xs text-gray-500 mt-1">Plays a 5-15s sponsor video before a user can start downloading subtitles.</p>
                    </div>
                    <button 
                      onClick={() => handleUpdateGlobalAds('vastVideo', vastVideoEnabled)}
                      disabled={savingSettings}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${vastVideoEnabled ? 'bg-netflix-red' : 'bg-gray-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${vastVideoEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section A: Ad Revenue Distribution */}
              <div className="p-8 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-netflix-red/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl text-white mb-2">Ad Revenue Distribution</h3>
                  <p className="text-sm text-gray-400">Distribute ad revenue proportionally among eligible creators based on their total downloads.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs</span>
                    <input 
                      type="number" 
                      value={adRevenueAmount}
                      onChange={(e) => setAdRevenueAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-black/60 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red focus:ring-1 focus:ring-netflix-red/50 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => setShowAdConfirm(true)}
                    disabled={!adRevenueAmount || isNaN(Number(adRevenueAmount)) || Number(adRevenueAmount) <= 0 || distributingAd}
                    className="bg-gradient-to-r from-netflix-red to-red-700 hover:from-red-600 hover:to-red-800 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Distribute Ad Revenue
                  </button>
                </div>
              </div>

              {/* Section B: Pro Pool Distribution */}
              <div className="p-8 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl text-white mb-2">Pro Pool Distribution</h3>
                  <p className="text-sm text-gray-400">Distribute Pro Membership pool proportionally based on Pro downloads.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rs</span>
                    <input 
                      type="number" 
                      value={proPoolAmount}
                      onChange={(e) => setProPoolAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-black/60 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red focus:ring-1 focus:ring-netflix-red/50 transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    onClick={() => setShowProConfirm(true)}
                    disabled={!proPoolAmount || isNaN(Number(proPoolAmount)) || Number(proPoolAmount) <= 0 || distributingPro}
                    className="bg-gradient-to-r from-netflix-red to-red-700 hover:from-red-600 hover:to-red-800 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Distribute Pro Revenue
                  </button>
                </div>
              </div>

              {/* Section C: Broadcast Notifications */}
              <div className="p-8 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-xl text-white mb-2">Broadcast Notification</h3>
                  <p className="text-sm text-gray-400">Send a notification to all registered users.</p>
                </div>
                <div className="flex flex-col gap-4 relative z-10">
                  <input 
                    type="text" 
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="Notification Title"
                    className="w-full bg-black/60 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red focus:ring-1 focus:ring-netflix-red/50 transition-all shadow-inner"
                  />
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Notification Message"
                    rows={3}
                    className="w-full bg-black/60 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red focus:ring-1 focus:ring-netflix-red/50 transition-all shadow-inner resize-none"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSendBroadcast}
                      disabled={!broadcastTitle.trim() || !broadcastMessage.trim() || sendingBroadcast}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                    >
                      {sendingBroadcast ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                      Send Broadcast
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {showAdConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-netflix-surface border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Ad Revenue Distribution</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to distribute Rs {adRevenueAmount} among eligible creators? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowAdConfirm(false)}
                disabled={distributingAd}
                className="px-4 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDistributeAdRevenue}
                disabled={distributingAd}
                className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-md font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {distributingAd ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}

      {showProConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-netflix-surface border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Pro Pool Distribution</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to distribute Rs {proPoolAmount} among eligible creators? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setShowProConfirm(false)}
                disabled={distributingPro}
                className="px-4 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDistributeProRevenue}
                disabled={distributingPro}
                className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-md font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {distributingPro ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSubtitle && (
        <EditSubtitleModal 
          subtitle={editingSubtitle} 
          onClose={() => setEditingSubtitle(null)} 
          onUpdate={handleSubtitleUpdate} 
        />
      )}

      {subtitleToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-netflix-surface border border-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this subtitle? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setSubtitleToDelete(null)}
                className="px-4 py-2 rounded-md font-medium text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold transition-colors"
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

