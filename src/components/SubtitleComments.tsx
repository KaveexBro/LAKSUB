import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, increment, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Comment, UserData } from '../types';
import { MessageSquare, ThumbsUp, Send, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';

const CommentInput = ({ 
  isReply = false, 
  parentId, 
  user,
  userData,
  signIn,
  handleSubmit,
  replyingTo,
  setReplyingTo,
  submitting,
  rootUserId
}: { 
  isReply?: boolean;
  parentId?: string;
  user: FirebaseUser | null;
  userData: UserData | null;
  signIn: () => void;
  handleSubmit: (parentId?: string, text?: string, rootUserId?: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  submitting: boolean;
  rootUserId?: string;
}) => {
  const [text, setText] = useState('');

  return (
    <div className={`flex gap-3 ${isReply ? 'mt-3 mb-2 rounded border border-gray-800 p-3 bg-white/5' : 'mb-8'}`}>
      {user ? (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-500" />
          )}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={signIn}>
          <User className="w-5 h-5 text-gray-500" />
        </div>
      )}
      <div className="flex-1 relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onClick={!user ? signIn : undefined}
          placeholder={user ? (isReply ? 'Write a reply...' : 'Add a comment...') : 'Please log in to comment'}
          readOnly={!user || submitting}
          className="w-full bg-transparent border-b border-gray-700 pb-2 text-sm text-white focus:outline-none focus:border-white resize-none min-h-[40px] px-1 placeholder:text-gray-500"
          rows={1}
        />
        {user && text.trim().length > 0 && (
          <div className="flex justify-end gap-2 mt-2">
            {isReply && (
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => {
                handleSubmit(parentId, text, rootUserId).then(() => {
                  setText('');
                });
              }}
              disabled={submitting}
              className="bg-netflix-red hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              {isReply ? 'Reply' : 'Comment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CommentThread = ({ 
  comment, 
  allComments, 
  user, 
  userData, 
  signIn,
  handleLike,
  handleDelete,
  handleSubmit,
  replyingTo,
  setReplyingTo,
  submitting,
  depth = 0
}: { 
  comment: Comment;
  allComments: Comment[];
  user: FirebaseUser | null;
  userData: UserData | null;
  signIn: () => void;
  handleLike: (comment: Comment) => void;
  handleDelete: (commentId: string) => void;
  handleSubmit: (parentId?: string, text?: string, rootUserId?: string) => Promise<void>;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  submitting: boolean;
  depth?: number;
}) => {
  const replies = allComments.filter(c => c.parentId === comment.id);
  const isLiked = user && comment.likedBy?.includes(user.uid);
  const isNested = depth > 0;
  const canDelete = user && (user.uid === comment.userId || userData?.role === 'admin' || user.uid === comment.rootUserId);
  
  return (
    <div className={`group/item ${isNested ? 'mt-4' : 'mb-6'}`}>
      <div className="flex gap-3">
        <div className={`${isNested ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5`}>
          {comment.userPhoto ? (
            <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
          ) : (
            <User className={`${isNested ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold text-white truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px] ${isNested ? 'text-sm' : 'text-[15px]'}`}>
                {comment.userName}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {canDelete && (
              <button
                onClick={() => handleDelete(comment.id)}
                className="text-gray-500 hover:text-netflix-red md:opacity-0 md:group-hover/item:opacity-100 transition-all p-1.5 rounded hover:bg-white/5"
                title="Delete comment"
              >
                <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => handleLike(comment)} 
              className={`flex items-center gap-1.5 text-xs transition-colors py-1 ${isLiked ? 'text-netflix-red font-medium' : 'text-gray-500 hover:text-white'}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-netflix-red' : ''}`} />
              <span>{comment.likesCount || 0}</span>
            </button>
            <button 
              onClick={() => {
                if (!user) signIn();
                else setReplyingTo(replyingTo === comment.id ? null : comment.id);
              }} 
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors py-1"
            >
              Reply
            </button>
          </div>
          
          <AnimatePresence>
            {replyingTo === comment.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <CommentInput 
                  isReply 
                  parentId={comment.id} 
                  user={user}
                  userData={userData}
                  signIn={signIn}
                  handleSubmit={handleSubmit}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  submitting={submitting}
                  rootUserId={comment.rootUserId || comment.userId}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {replies.length > 0 && (
            <div className={`mt-3 object-left ${depth === 0 ? 'ml-1 pl-3 md:ml-2 md:pl-4 border-l-2 border-gray-800' : 'mt-4'} space-y-4`}>
              {replies.map(reply => (
                <CommentThread 
                  key={reply.id} 
                  comment={reply} 
                  allComments={allComments}
                  user={user}
                  userData={userData}
                  signIn={signIn}
                  handleLike={handleLike}
                  handleDelete={handleDelete}
                  handleSubmit={handleSubmit}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  submitting={submitting}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const SubtitleComments: React.FC<{ subtitleId: string; uploaderId?: string; subtitleTitle?: string }> = ({ subtitleId, uploaderId, subtitleTitle }) => {
  const { user, userData, signIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!subtitleId) return;

    const q = query(
      collection(db, 'comments'),
      where('subtitleId', '==', subtitleId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [subtitleId]);

  const handleSubmit = async (parentId?: string, text?: string, rootUserId?: string) => {
    if (!user || !userData || !text || text.trim() === '') return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        subtitleId,
        userId: user.uid,
        userName: userData.displayName || 'Anonymous',
        userPhoto: userData.photoURL || null,
        content: text.trim(),
        createdAt: new Date().toISOString(),
        likesCount: 0,
        likedBy: [],
        ...(parentId && { parentId }),
        ...(rootUserId && { rootUserId })
      });

      // Notification Logic
      const targetUserIds = new Set<string>();
      if (parentId) {
        const parentComment = comments.find(c => c.id === parentId);
        if (parentComment && parentComment.userId !== user.uid) {
           targetUserIds.add(parentComment.userId);
        }
      } else {
        if (uploaderId && uploaderId !== user.uid) {
           targetUserIds.add(uploaderId);
        }
      }

      for (const targetUid of targetUserIds) {
        await addDoc(collection(db, 'notifications'), {
          userId: targetUid,
          title: parentId ? 'New Reply to Your Comment' : 'New Comment on Your Subtitle',
          message: `${userData.displayName || 'Someone'} ${parentId ? 'replied to your comment' : 'commented on your subtitle'} ${subtitleTitle ? `"${subtitleTitle}"` : ''}.`,
          type: 'comment',
          read: false,
          createdAt: new Date().toISOString(),
          link: `/subtitles/${subtitleId}`
        });
      }

      if (parentId) {
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (comment: Comment) => {
    if (!user) {
      signIn();
      return;
    }
    try {
      const isLiked = comment.likedBy?.includes(user.uid);
      const newLikedBy = isLiked 
        ? (comment.likedBy || []).filter(id => id !== user.uid)
        : [...(comment.likedBy || []), user.uid];

      await updateDoc(doc(db, 'comments', comment.id), {
        likesCount: increment(isLiked ? -1 : 1),
        likedBy: newLikedBy
      });
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      // Find all nested child replies
      const idsToDelete = new Set([commentId]);
      
      const findChildren = (parentId: string) => {
        comments.filter(c => c.parentId === parentId).forEach(child => {
          idsToDelete.add(child.id);
          findChildren(child.id);
        });
      };
      
      findChildren(commentId);
      
      // Delete all child replies first, so we don't leave orphans (even if some fail due to permissions)
      const childIds = Array.from(idsToDelete).filter(id => id !== commentId);
      await Promise.allSettled(childIds.map(id => deleteDoc(doc(db, 'comments', id))));
      
      // Finally delete the target comment itself
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const topLevelComments = comments.filter(c => !c.parentId);

  return (
    <div className="mt-12 bg-netflix-surface rounded-xl p-6 border border-gray-800 shadow-2xl">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-netflix-red" />
        Discussion <span className="text-gray-500 font-normal text-base ml-1">({comments.length})</span>
      </h3>
      
      <CommentInput 
        user={user} 
        userData={userData} 
        signIn={signIn} 
        handleSubmit={handleSubmit}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        submitting={submitting}
      />
      
      {comments.length === 0 ? (
        <div className="text-center py-12 bg-black/20 rounded-lg border border-dashed border-gray-800">
          <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No comments yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-6 pt-4">
          {topLevelComments.map(comment => (
            <CommentThread 
              key={comment.id} 
              comment={comment} 
              allComments={comments}
              user={user}
              userData={userData}
              signIn={signIn}
              handleLike={handleLike}
              handleDelete={handleDelete}
              handleSubmit={handleSubmit}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

