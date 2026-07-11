import React, { useState } from 'react';
import { UserData } from '../types';
import { Lock, CheckCircle, AlertCircle, DollarSign, TrendingUp, Download, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

interface CreatorWalletProps {
  userData: UserData;
  onUpdate: () => void;
}

export const CreatorWallet: React.FC<CreatorWalletProps> = ({ userData, onUpdate }) => {
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const UPLOAD_TARGET = 10;
  const DOWNLOAD_TARGET = 500;

  const uploadProgress = Math.min(((userData.totalUploads || 0) / UPLOAD_TARGET) * 100, 100);
  const downloadProgress = Math.min(((userData.totalDownloads || 0) / DOWNLOAD_TARGET) * 100, 100);

  const canApply = (userData.totalUploads || 0) >= UPLOAD_TARGET && (userData.totalDownloads || 0) >= DOWNLOAD_TARGET;

  const handleApply = async () => {
    if (!canApply || applying) return;
    setApplying(true);
    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        monetizationStatus: 'pending_review'
      });
      onUpdate();
    } catch (err) {
      console.error("Error applying for monetization:", err);
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount < 1000) {
      setWithdrawError("Minimum withdrawal is 1,000 LKR.");
      return;
    }
    if (withdrawAmount > userData.walletBalance) {
      setWithdrawError("Insufficient balance.");
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');
    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: userData.uid,
        userName: userData.displayName,
        amount: withdrawAmount,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      
      await updateDoc(doc(db, 'users', userData.uid), {
        walletBalance: userData.walletBalance - withdrawAmount
      });
      
      setWithdrawSuccess(true);
      onUpdate();
    } catch (err) {
      console.error("Withdrawal error:", err);
      setWithdrawError("Failed to process withdrawal. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (userData.monetizationStatus !== 'approved' || !canApply) {
    return (
      <div className="space-y-8">
        {/* Eligibility Header */}
        <div className="bg-netflix-surface p-8 rounded-xl border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Lock className="w-6 h-6 text-netflix-red" /> 
              Monetization Eligibility
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl">
              Unlock your earning potential. Once you meet the following targets, you can apply for our Revenue Pool monetization system.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Target 1: Uploads */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-netflix-red" /> Approved Subtitles
                  </span>
                  <span className="text-xs font-bold text-netflix-red">{userData.totalUploads || 0} / {UPLOAD_TARGET}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    className="h-full bg-netflix-red"
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Target: 10 Approved Subtitles</p>
              </div>

              {/* Target 2: Downloads */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Download className="w-4 h-4 text-netflix-red" /> Total Downloads
                  </span>
                  <span className="text-xs font-bold text-netflix-red">{userData.totalDownloads || 0} / {DOWNLOAD_TARGET}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                    className="h-full bg-netflix-red"
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Target: 500 Total Downloads</p>
              </div>
            </div>

            {userData.monetizationStatus === 'pending_review' ? (
              <div className="bg-yellow-900/20 border border-yellow-500/30 p-6 rounded-lg flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-yellow-500">Application Under Review</h3>
                  <p className="text-sm text-yellow-200/70">Our team is reviewing your profile. You will be notified once approved.</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleApply}
                disabled={!canApply || applying}
                className={`w-full md:w-auto px-6 py-3 rounded-md font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg ${
                  canApply 
                    ? 'bg-netflix-red text-white hover:bg-red-700 hover:scale-105' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                {applying ? 'Processing...' : canApply ? 'Apply for Monetization' : 'Targets Not Met Yet'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Locked Earnings Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-6">
              <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Earnings section is locked until approved</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 grayscale">
            <div className="bg-netflix-surface p-6 rounded-xl border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold">0 LKR</p>
            </div>
            <div className="bg-netflix-surface p-6 rounded-xl border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Estimated Next Payout</p>
              <p className="text-3xl font-bold">0 LKR</p>
            </div>
            <div className="bg-netflix-surface p-6 rounded-xl border border-gray-800">
              <p className="text-gray-400 text-sm mb-1">Total Earned</p>
              <p className="text-3xl font-bold">0 LKR</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-netflix-surface p-8 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign className="w-32 h-32" />
          </div>
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-netflix-red" /> Wallet Balance
          </p>
          <p className="text-4xl font-bold text-white">{userData.walletBalance.toLocaleString()} <span className="text-lg text-gray-500">LKR</span></p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-netflix-surface p-8 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="w-32 h-32" />
          </div>
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Estimated Next Payout
          </p>
          <p className="text-4xl font-bold text-white">Calculated Monthly</p>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Based on Revenue Pool</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-netflix-surface p-8 rounded-xl border border-gray-800 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle className="w-32 h-32" />
          </div>
          <p className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" /> Monetization Status
          </p>
          <p className="text-4xl font-bold text-green-500">Approved</p>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Active & Earning</p>
        </motion.div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-netflix-surface p-8 rounded-xl border border-gray-800 shadow-2xl">
        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-netflix-red" /> Request Withdrawal
        </h3>
        
        {withdrawSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-900/20 border border-green-500/30 p-8 rounded-lg text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-green-500 mb-2">Withdrawal Requested!</h4>
            <p className="text-gray-400 mb-6">Your request is being processed. Payments are usually made within 3-5 business days.</p>
            <button 
              onClick={() => setWithdrawSuccess(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
            >
              Make Another Request
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleWithdraw} className="max-w-md">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount to Withdraw (LKR)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={withdrawAmount || ''}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="Minimum 1,000"
                  className="w-full bg-black border border-gray-700 rounded-md px-4 py-3 text-xl font-bold focus:border-netflix-red focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">LKR</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Available Balance: {userData.walletBalance.toLocaleString()} LKR</p>
            </div>

            {withdrawError && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-md mb-6 flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5" />
                {withdrawError}
              </div>
            )}

            <button 
              type="submit"
              disabled={withdrawing || userData.walletBalance < 1000}
              className="w-full bg-netflix-red text-white py-3 rounded-md font-bold text-lg hover:bg-red-700 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {withdrawing ? 'Processing...' : 'Withdraw Funds'}
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-6 uppercase tracking-widest">
              Secure Payments via Bank Transfer
            </p>
          </form>
        )}
      </div>

      {/* Revenue Pool Info */}
      <div className="bg-netflix-surface/50 p-6 rounded-xl border border-gray-800/50 italic text-sm text-gray-400">
        <p>
          <strong>Revenue Pool System:</strong> Your monthly earnings are calculated based on the total Pro subscription pool divided by total Pro downloads, multiplied by your specific Pro download count. This ensures a fair distribution of revenue among all eligible creators.
        </p>
      </div>
    </div>
  );
};
