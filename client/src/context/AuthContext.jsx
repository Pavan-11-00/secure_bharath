import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Guest user object for demo/guest mode
const GUEST_USER = {
  uid: 'guest-user',
  email: 'guest@securebharat.in',
  displayName: 'Guest User',
  photoURL: null,
  isGuest: true,
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [levelProgress, setLevelProgress] = useState({});

  const API_URL = 'http://localhost:5000';

  // Sync user data with backend
  async function syncUserData(data = {}) {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_URL}/api/user/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          points: data.points ?? points,
          levelProgress: data.levelProgress ?? levelProgress
        })
      });
      if (response.ok) {
        const syncedUser = await response.json();
        // Only sync points from server (it takes the max).
        // Do NOT override levelProgress — local state is already updated
        // optimistically and overwriting it causes progress to reset.
        if (syncedUser.points !== undefined) {
          setPoints(syncedUser.points);
        }
      }
    } catch (err) {
      console.error('Failed to sync user data:', err);
    }
  }

  // Fetch user data from backend
  async function fetchUserData(uid) {
    try {
      const response = await fetch(`${API_URL}/api/user/${uid}`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data.points || 0);
        setLevelProgress(data.levelProgress || {});
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  }

  const addPoints = (amount) => {
    const nextPoints = points + amount;
    setPoints(nextPoints);
    syncUserData({ points: nextPoints });
    // Also update local storage as fallback
    localStorage.setItem('csb_points', nextPoints);
  };

  const updateLevelProgress = (newProgress) => {
    const nextProgress = { ...levelProgress, ...newProgress };
    setLevelProgress(nextProgress);
    syncUserData({ levelProgress: nextProgress });
    localStorage.setItem('csb_level_progress', JSON.stringify(nextProgress));
  };

  // Email Sign Up
  function signup(email, password, displayName) {
    if (!auth) throw new Error("Firebase not configured");
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        return updateProfile(userCredential.user, { displayName });
      });
  }

  // Email Login
  function login(email, password) {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google OAuth Login
  function loginWithGoogle() {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithPopup(auth, googleProvider);
  }

  // Guest Login - no Firebase needed
  function loginAsGuest() {
    setCurrentUser(GUEST_USER);
    localStorage.setItem('csb_guest_mode', 'true');
    return Promise.resolve(GUEST_USER);
  }

  // Logout
  function logout() {
    // Clear guest mode
    localStorage.removeItem('csb_guest_mode');
    setCurrentUser(null);
    if (!auth) return Promise.resolve();
    return signOut(auth);
  }

  // Monitor Auth State
  useEffect(() => {
    // Check if guest mode was active
    const wasGuest = localStorage.getItem('csb_guest_mode') === 'true';
    if (wasGuest) {
      setCurrentUser(GUEST_USER);
      fetchUserData(GUEST_USER.uid);
      setLoading(false);
      return;
    }

    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserData(user.uid);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Get admin email from environment or comma-separated list
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const isAdmin = currentUser && adminEmails.includes(currentUser.email);

  const value = {
    currentUser,
    isAdmin,
    login,
    signup,
    loginWithGoogle,
    loginAsGuest,
    logout,
    points,
    addPoints,
    levelProgress,
    updateLevelProgress,
    syncUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
