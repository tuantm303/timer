import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { 
  Clock, 
  Globe, 
  History, 
  Settings, 
  HelpCircle, 
  Search, 
  Plus, 
  MoreVertical, 
  Cloud, 
  Users, 
  Play, 
  Upload, 
  CheckCircle, 
  Zap,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  LogIn,
  Trash2,
  Edit2,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  auth,
  storage, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  getDocFromServer, 
  getDocs,
  getDocsFromServer,
  Timestamp, 
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteDoc,
  updateDoc,
  where,
  setDoc,
  terminate,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from './firebase';

// --- Utilities ---

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = async () => {
    try {
      // Attempt to terminate Firestore to clear internal state
      await terminate(db);
      console.log("Firestore terminated successfully.");
    } catch (e) {
      console.error("Failed to terminate Firestore:", e);
    }
    // Clear local storage as well
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark text-white p-8">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong</h2>
            <p className="text-sm text-slate-400 mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={this.handleReset}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              Reset App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Components ---

const SessionSelectionView = ({ onSelect }: { onSelect: (session: string) => void }) => {
  const sessionIds = ["Ca 1", "Ca 2", "Ca 3", "Ca 4"];
  const [sessionNames, setSessionNames] = useState<Record<string, string>>({
    "Ca 1": "Ca 1",
    "Ca 2": "Ca 2",
    "Ca 3": "Ca 3",
    "Ca 4": "Ca 4"
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'sessions'));
        if (!isMounted) return;
        const names: Record<string, string> = {
          "Ca 1": "Ca 1",
          "Ca 2": "Ca 2",
          "Ca 3": "Ca 3",
          "Ca 4": "Ca 4"
        };
        snapshot.docs.forEach(doc => {
          names[doc.id] = doc.data().name;
        });
        setSessionNames(names);
      } catch (error: any) {
        console.error("Session selection fetch error:", error);
        try {
          handleFirestoreError(error, OperationType.GET, 'sessions');
        } catch (e) {
          // Error already logged
        }
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Refresh every 30s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" 
      style={{ backgroundImage: 'url("https://hoangmaistarschool.edu.vn/thongtin/nen.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"></div>
      
      {/* Header with Logo moved to top-left */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-20 py-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/95 p-2 md:p-3 rounded-2xl shadow-lg backdrop-blur-md"
        >
          <img 
            src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" 
            alt="Logo" 
            className="h-12 md:h-16 w-auto object-contain" 
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 -mt-20">
        <div className="text-center mb-12">
          <h2 className="text-white text-4xl md:text-5xl font-black uppercase tracking-[0.1em] drop-shadow-lg mb-4">HỆ THỐNG CHUÔNG HIỆU LỆNH THI</h2>
          <p className="text-red-600 text-2xl md:text-3xl font-black uppercase tracking-widest drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">THẦY / CÔ VUI LÒNG CHỌN CA THI</p>
        </div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {sessionIds.map((sessionId, index) => (
            <motion.button
              key={sessionId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.98)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(sessionId)}
              className="h-40 bg-white/80 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 flex flex-col items-center justify-center gap-4 transition-all group backdrop-blur-xl px-6"
            >
              <div className="size-16 bg-[#a20d0d] rounded-3xl flex items-center justify-center text-[#23328c] shadow-[1px_1px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform">
                <img src="https://hoangmaistarschool.edu.vn/thongtin/chuongv.svg" className="size-10 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[30px] md:text-[36px] font-black text-[#23328c] tracking-tight text-center line-clamp-2 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">{sessionNames[sessionId]}</span>
            </motion.button>
          ))}
        </div>

        <footer className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/60 text-xs tracking-[0.3em] font-bold uppercase">© Design by TuanTM</p>
        </footer>
      </div>
    </div>
  );
};

const ClockView = ({ selectedSession, onAdminClick, onBackClick }: { selectedSession: string, onAdminClick: () => void, onBackClick: () => void }) => {
  const [time, setTime] = useState(new Date());
  const [timers, setTimers] = useState<any[]>([]);
  const [nextTimer, setNextTimer] = useState<any>(null);
  const [playedTimers, setPlayedTimers] = useState<Set<string>>(new Set());
  const [sessionName, setSessionName] = useState(selectedSession);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch session name
  const fetchSessionName = useCallback(async () => {
    const path = `sessions/${selectedSession}`;
    try {
      const docSnap = await getDoc(doc(db, 'sessions', selectedSession));
      if (docSnap.exists()) {
        setSessionName(docSnap.data().name);
      } else {
        setSessionName(selectedSession);
      }
    } catch (error: any) {
      console.error("ClockView session name error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // Error already logged
      }
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessionName();
    const interval = setInterval(fetchSessionName, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchSessionName]);

  // Sync with Firestore
  const fetchTimers = useCallback(async () => {
    const path = 'timers';
    try {
      const q = query(
        collection(db, 'timers'), 
        where('sessionId', '==', selectedSession)
      );
      const snapshot = await getDocs(q);
      const timersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by date and time in memory to avoid requiring a composite index
      timersData.sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
      
      setTimers(timersData);
    } catch (error: any) {
      console.error("ClockView timers error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // Error already logged
      }
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchTimers();
    const interval = setInterval(fetchTimers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchTimers]);

  // Preload audio files to cache them for offline use
  useEffect(() => {
    timers.forEach(timer => {
      if (timer.ringtoneUrl) {
        // Use a standard fetch without any potential overrides
        // Service Worker will intercept and cache it based on vite.config.ts patterns
        try {
          window.fetch(timer.ringtoneUrl, { mode: 'no-cors' })
            .catch(e => console.warn("Audio preload warning (non-fatal):", e.message));
        } catch (e: any) {
          console.warn("Audio preload catch (non-fatal):", e.message);
        }
      }
    });
  }, [timers]);

  // Clock and Alarm Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      const currentSecond = now.getSeconds();

      // Find if any timer matches current date and time
      const activeTimer = timers.find(t => t.date === currentDate && t.time === currentTime);
      
      if (activeTimer && !playedTimers.has(activeTimer.id) && currentSecond === 0) {
        console.log("Triggering alarm:", activeTimer.ringtoneName);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(activeTimer.ringtoneUrl);
        audioRef.current = audio;
        
        let playCount = 0;
        const targetCount = activeTimer.repeatCount || 1;
        
        const playAudio = () => {
          audio.currentTime = 0;
          audio.play().catch(e => console.error("Audio play failed:", e));
        };
        
        audio.addEventListener('ended', () => {
          playCount++;
          if (playCount < targetCount) {
            playAudio();
          }
        });
        
        playAudio();
        
        setPlayedTimers(prev => new Set(prev).add(activeTimer.id));
      }

      // Update Next Timer display
      const upcoming = timers.filter(t => {
        if (t.date > currentDate) return true;
        if (t.date === currentDate && t.time > currentTime) return true;
        return false;
      })[0];
      setNextTimer(upcoming);

      // Reset played timers at midnight
      if (currentTime === '00:00' && currentSecond === 0) {
        setPlayedTimers(new Set());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timers, playedTimers]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" 
      style={{ backgroundImage: 'url("https://hoangmaistarschool.edu.vn/thongtin/nen.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-start justify-between px-6 md:px-20 py-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackClick}
              className="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer text-white shadow-lg"
              title="Quay lại chọn ca thi"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-center gap-3 bg-white/95 p-2 md:p-3 rounded-[10px] shadow-lg shadow-black/10 backdrop-blur-sm w-fit">
              <img 
                src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" 
                alt="Logo" 
                className="h-12 md:h-16 w-auto object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  fetchSessionName();
                  fetchTimers();
                }}
                className="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer text-white shadow-lg"
                title="Làm mới"
              >
                <RefreshCw className="size-5" />
              </button>
              <button 
                onClick={onAdminClick}
                className="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer text-white shadow-lg"
              >
                <Settings className="size-5" />
              </button>
            </div>
            <div className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
              {sessionName}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 mb-8"
          >
            {nextTimer && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-[#23328c] bg-[#a20d0d] px-6 py-3 rounded-full shadow-[1px_1px_0px_rgba(0,0,0,1)]"
              >
                <img src="https://hoangmaistarschool.edu.vn/thongtin/chuongv.svg" className="size-6 animate-pulse drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]" referrerPolicy="no-referrer" />
                <span className="text-lg md:text-xl font-black uppercase tracking-widest">
                  Next: {nextTimer.time} ({nextTimer.ringtoneName})
                </span>
              </motion.div>
            )}
          </motion.div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="relative flex flex-col items-center justify-center">
              <h1 className="text-white tracking-wide text-8xl md:text-[12rem] font-black leading-none tabular-nums drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">
                {formatTime(time)}
              </h1>
              <p className="text-white text-3xl md:text-5xl font-black tracking-[0.1em] uppercase mt-4 md:mt-8 text-center drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">
                {formatDate(time)}
              </p>
            </div>
          </motion.div>
        </main>

        <footer className="p-10 text-center">
          <p className="text-[#adddff] text-[12px] tracking-[0.3em] font-bold drop-shadow-[1px_1px_1px_rgba(0,0,0,1)]">© Design by TuanTM</p>
        </footer>
      </div>
    </div>
  );
};

const AdminView = ({ selectedSession, onBackClick }: { selectedSession: string, onBackClick: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    } catch (error: any) {
      console.error("Login failed:", error);
      let message = "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản/mật khẩu.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Email hoặc mật khẩu không chính xác.";
      } else if (error.code === 'auth/too-many-requests') {
        message = "Quá nhiều lần thử thất bại. Vui lòng thử lại sau.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Tính năng đăng nhập bằng Email/Mật khẩu chưa được bật trong Firebase Console.";
      } else {
        message = `Lỗi: ${error.message}`;
      }
      setAuthError(message);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Google login failed:", error);
      setAuthError(`Lỗi đăng nhập Google: ${error.message}`);
    }
  };
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('00');
  const [ringtoneUrl, setRingtoneUrl] = useState('https://hoangmaistarschool.edu.vn/ta/School.mp3');
  const [ringtoneName, setRingtoneName] = useState('');
  const [ringtoneOption, setRingtoneOption] = useState<'school' | 'chuongsb' | 'custom'>('school');
  const [repeatCount, setRepeatCount] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [timers, setTimers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [timerToDelete, setTimerToDelete] = useState<string | null>(null);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState(selectedSession);
  const [isSavingSessionName, setIsSavingSessionName] = useState(false);

  const fetchSessionName = useCallback(async () => {
    const path = `sessions/${selectedSession}`;
    try {
      const docSnap = await getDoc(doc(db, 'sessions', selectedSession));
      if (docSnap.exists()) {
        setCurrentSessionName(docSnap.data().name);
      }
    } catch (error: any) {
      console.error("AdminView session name error:", error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // Error already logged
      }
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessionName();
  }, [fetchSessionName]);

  const handleSaveSessionName = async () => {
    if (!currentSessionName.trim() || isSaving || isSavingSessionName) return;
    setIsSavingSessionName(true);
    setFeedback(null);
    const path = `sessions/${selectedSession}`;
    try {
      await setDoc(doc(db, 'sessions', selectedSession), { name: currentSessionName.trim() }, { merge: true });
      setFeedback({ message: 'Tên ca thi đã được cập nhật!', type: 'success' });
      await fetchSessionName(); // Refresh after save
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error("Save session name error:", error);
      let errorMessage = `Lỗi: ${error.message}`;
      if (error.message.includes('Missing or insufficient permissions')) {
        errorMessage = 'Lỗi quyền truy cập: Bạn cần cập nhật Firestore Rules trong Firebase Console để cho phép ghi dữ liệu.';
      }
      setFeedback({ message: errorMessage, type: 'error' });
      
      // Log detailed error for debugging
      try {
        handleFirestoreError(error, OperationType.WRITE, path);
      } catch (e) {
        // Error already logged by handleFirestoreError
      }
    } finally {
      setIsSavingSessionName(false);
    }
  };

  const fetchTimers = useCallback(async () => {
    const path = 'timers';
    try {
      const q = query(
        collection(db, 'timers'), 
        where('sessionId', '==', selectedSession)
      );
      const snapshot = await getDocs(q);
      const timersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by date and time in memory to avoid requiring a composite index
      timersData.sort((a, b) => {
        if (a.date === b.date) {
          return a.time.localeCompare(b.time);
        }
        return a.date.localeCompare(b.date);
      });
      
      setTimers(timersData);
    } catch (error: any) {
      console.error("AdminView timers error:", error);
      setFeedback({ message: "Lỗi tải danh sách chuông.", type: 'error' });
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // Error already logged
      }
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers]);

  const handleDelete = async (id: string) => {
    if (isSaving || isSavingSessionName) return;
    setTimerToDelete(id);
  };

  const confirmDelete = async () => {
    if (!timerToDelete || isSaving || isSavingSessionName) return;
    try {
      await deleteDoc(doc(db, 'timers', timerToDelete));
      setTimerToDelete(null);
      await fetchTimers(); // Refresh after delete
    } catch (error: any) {
      console.error("Error deleting timer:", error);
      setFeedback({ message: `Failed to delete timer: ${error.message}`, type: 'error' });
      setTimerToDelete(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleOptionChange = (option: 'school' | 'chuongsb' | 'custom') => {
    setRingtoneOption(option);
    if (option === 'school') {
      setRingtoneUrl('https://hoangmaistarschool.edu.vn/ta/School.mp3');
    } else if (option === 'chuongsb') {
      setRingtoneUrl('https://hoangmaistarschool.edu.vn/ta/chuongsb.mp3');
    } else {
      setRingtoneUrl('');
    }
  };

  const handleEdit = (timer: any) => {
    if (isSaving || isSavingSessionName) return;
    setEditingTimerId(timer.id);
    setDate(timer.date);
    const [h, m] = timer.time.split(':');
    setHours(h);
    setMinutes(m);
    setRingtoneName(timer.ringtoneName);
    setRingtoneUrl(timer.ringtoneUrl);
    setRepeatCount(timer.repeatCount?.toString() || '1');
    
    if (timer.ringtoneUrl === 'https://hoangmaistarschool.edu.vn/ta/School.mp3') {
      setRingtoneOption('school');
    } else if (timer.ringtoneUrl === 'https://hoangmaistarschool.edu.vn/ta/chuongsb.mp3') {
      setRingtoneOption('chuongsb');
    } else {
      setRingtoneOption('custom');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (isSaving || isSavingSessionName) return;
    setFeedback(null);
    if (!date) {
      setFeedback({ message: 'Please select a date', type: 'error' });
      return;
    }
    if (!ringtoneUrl.trim() || !ringtoneName.trim()) {
      setFeedback({ message: 'Please provide a ringtone URL and name', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingTimerId) {
        await updateDoc(doc(db, 'timers', editingTimerId), {
          date,
          time: `${hours}:${minutes}`,
          ringtoneName: ringtoneName.trim(),
          ringtoneUrl: ringtoneUrl.trim(),
          repeatCount: parseInt(repeatCount, 10) || 1,
          sessionId: selectedSession,
        });
        setFeedback({ message: 'Timer updated successfully!', type: 'success' });
        setEditingTimerId(null);
      } else {
        await addDoc(collection(db, 'timers'), {
          date,
          time: `${hours}:${minutes}`,
          ringtoneName: ringtoneName.trim(),
          ringtoneUrl: ringtoneUrl.trim(),
          repeatCount: parseInt(repeatCount, 10) || 1,
          sessionId: selectedSession,
          createdBy: user?.uid || 'admin_pin',
          createdAt: serverTimestamp()
        });
        setFeedback({ message: 'Timer saved successfully!', type: 'success' });
      }

      await fetchTimers(); // Refresh after save

      setRingtoneOption('school');
      setRingtoneUrl('https://hoangmaistarschool.edu.vn/ta/School.mp3');
      setRingtoneName('');
      setRepeatCount('1');
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedback(null), 3000);
    } catch (error: any) {
      console.error("Save failed:", error);
      let errorMessage = `Failed to save timer: ${error.message}`;
      if (error.message.includes('Missing or insufficient permissions')) {
        errorMessage = 'Lỗi quyền truy cập: Bạn cần cập nhật Firestore Rules trong Firebase Console để cho phép ghi dữ liệu.';
      }
      setFeedback({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const [showSupport, setShowSupport] = useState(false);

  if (!user && !isAuthLoading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-slate-800 p-4"
        style={{ backgroundImage: 'url("https://hoangmaistarschool.edu.vn/thongtin/nshm_nen1.jpg")' }}
      >
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/70 border border-white/40 rounded-3xl p-10 text-center backdrop-blur-2xl max-w-md w-full shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        >
          <img 
            src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" 
            alt="Logo" 
            className="h-16 mx-auto mb-6 object-contain" 
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-semibold mb-2 text-slate-900">Admin Login</h2>
          
          <p className="text-slate-500 mb-6 text-sm">Vui lòng đăng nhập tài khoản quản trị để tiếp tục.</p>
          <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-white/50 border border-slate-200/50 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block ml-1">Mật khẩu</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/50 border border-slate-200/50 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 transition-all"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-xs font-medium text-center">{authError}</p>}
            <button 
              type="submit"
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all mt-4 shadow-lg shadow-red-600/25"
            >
              <LogIn className="size-5" />
              Đăng nhập
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 px-2 text-slate-400 backdrop-blur-sm">Hoặc</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5" />
            Đăng nhập bằng Google
          </button>

          <button 
            onClick={onBackClick}
            className="mt-6 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
          >
            Back to Clock
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="flex h-screen text-slate-800 overflow-hidden bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("https://hoangmaistarschool.edu.vn/thongtin/nen.jpg")' }}
    >
      <div className="absolute inset-0 bg-slate-50/90 backdrop-blur-xl"></div>
      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200/50 flex flex-col bg-white/60 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-6 flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-8">
                <img 
                  src="https://hoangmaistarschool.edu.vn/thongtin/LogoNSHM.png" 
                  alt="Logo" 
                  className="h-8 w-auto object-contain" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-lg font-semibold leading-none text-slate-900">Admin</h1>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Control Panel</p>
                </div>
              </div>
            
            <nav className="flex flex-col gap-2 relative">
              <NavItem icon={<Plus className="size-4" />} label="Create Timer" active />
              
              <div className="mt-4 px-4 py-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Session Name</p>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={currentSessionName}
                    onChange={(e) => setCurrentSessionName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                    placeholder="Tên ca thi..."
                  />
                  <button 
                    onClick={handleSaveSessionName}
                    disabled={isSavingSessionName || isSaving}
                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all disabled:opacity-50 shadow-md shadow-red-600/20"
                  >
                    {isSavingSessionName ? 'Saving...' : 'Update Name'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowSupport(!showSupport)}
                  className="w-full text-left"
                >
                  <NavItem icon={<HelpCircle className="size-4" />} label="Support" />
                </button>
                
                <AnimatePresence>
                  {showSupport && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full top-0 ml-4 w-64 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50"
                    >
                      <div className="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-b border-slate-200/80 transform rotate-45"></div>
                      <div className="relative z-10 space-y-2 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Liên hệ Mr Tuấn</p>
                        <p>SĐT: 0987804666</p>
                        <p>Email: tuan303@gmail.com</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>

          <div className="mt-auto p-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/80 transition-colors group cursor-pointer shadow-sm border border-transparent hover:border-slate-200/50">
              <div className="size-10 rounded-full overflow-hidden bg-red-100 flex items-center justify-center text-red-600">
                <Users className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900">Administrator</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">PIN Access</p>
              </div>
              <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className="h-16 border-b border-slate-200/50 bg-white/60 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
            <h2 className="text-xl font-semibold text-slate-900">{editingTimerId ? 'Edit Timer' : 'Cài Đặt Chuông Báo Giờ'}</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  fetchSessionName();
                  fetchTimers();
                }}
                className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                title="Tải lại dữ liệu"
              >
                <RefreshCw className={`size-4 ${isSaving || isSavingSessionName ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={onBackClick}
                className="text-slate-600 hover:text-slate-900 transition-all text-sm font-bold bg-white/80 px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm hover:shadow-md"
              >
                Back to Clock
              </button>
            </div>
          </header>

          <div className="p-8 max-w-2xl mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 border border-slate-200/50 rounded-3xl p-8 space-y-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
              {/* Date Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Select Date</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                />
              </div>

              {/* Time Selection (24h) */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Select Time (24h Format)</label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase ml-1">Hours</span>
                    <select 
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase ml-1">Minutes</span>
                    <select 
                      value={minutes}
                      onChange={(e) => setMinutes(e.target.value)}
                      className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm appearance-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                    >
                      {Array.from({ length: 60 }).map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ringtone Input */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Ringtone Details</label>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={ringtoneName}
                    onChange={(e) => setRingtoneName(e.target.value)}
                    placeholder="Ringtone Name (e.g., Morning Bell)"
                    className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                  />

                  <div className="flex flex-col gap-3 mb-4 bg-white/50 border border-slate-200/80 rounded-2xl p-4 shadow-sm">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ringtoneOption" 
                        checked={ringtoneOption === 'school'}
                        onChange={() => handleOptionChange('school')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">Chuông School</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ringtoneOption" 
                        checked={ringtoneOption === 'chuongsb'}
                        onChange={() => handleOptionChange('chuongsb')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">Chuông SB</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ringtoneOption" 
                        checked={ringtoneOption === 'custom'}
                        onChange={() => handleOptionChange('custom')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700 font-medium">Khác</span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {ringtoneOption === 'custom' && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <input 
                          type="url" 
                          value={ringtoneUrl}
                          onChange={(e) => setRingtoneUrl(e.target.value)}
                          placeholder="Ringtone URL (e.g., https://example.com/audio.mp3)"
                          className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase ml-1">Repeat Count</span>
                    <input 
                      type="number" 
                      min="1"
                      max="100"
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(e.target.value)}
                      placeholder="Number of times to repeat"
                      className="w-full bg-white/50 border border-slate-200/80 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none text-slate-900 shadow-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {feedback && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${feedback.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
                >
                  {feedback.type === 'error' ? <X className="size-5" /> : <CheckCircle className="size-5" />}
                  {feedback.message}
                </motion.div>
              )}

              <button 
                onClick={handleSave}
                disabled={isSaving || isSavingSessionName}
                className="w-full py-4 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving && <div className="size-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>}
                {isSaving ? 'Saving...' : (editingTimerId ? 'Update Timer' : 'Save Timer')}
              </button>
              
              {editingTimerId && (
                <button 
                  onClick={() => {
                    setEditingTimerId(null);
                    setRingtoneOption('school');
                    setRingtoneUrl('https://hoangmaistarschool.edu.vn/ta/School.mp3');
                    setRingtoneName('');
                    setRepeatCount('1');
                  }}
                  disabled={isSaving || isSavingSessionName}
                  className="w-full mt-3 py-4 bg-white/50 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  Cancel Edit
                </button>
              )}
            </motion.div>

            {/* Timers List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 bg-white/70 border border-slate-200/50 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900">
                <img src="https://hoangmaistarschool.edu.vn/thongtin/chuongv.svg" className="size-6 text-red-600 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.3)]" referrerPolicy="no-referrer" />
                Active Timers
              </h3>
              
              {timers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No timers created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {timers.map((timer) => (
                    <div key={timer.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-slate-200/80 hover:border-blue-300 transition-colors shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl font-mono font-semibold text-lg border border-red-100">
                          {timer.time}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{timer.ringtoneName}</p>
                          <p className="text-xs text-slate-500">{timer.date}</p>
                        </div>
                      </div>
                      {timerToDelete === timer.id ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={confirmDelete}
                            disabled={isSaving || isSavingSessionName}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setTimerToDelete(null)}
                            disabled={isSaving || isSavingSessionName}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEdit(timer)}
                            disabled={isSaving || isSavingSessionName}
                            className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit Timer"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(timer.id)}
                            disabled={isSaving || isSavingSessionName}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete Timer"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Helper Components ---

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${active ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

export default function App() {
  const [view, setView] = useState<'session_selection' | 'clock' | 'admin'>('session_selection');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const handleSessionSelect = (session: string) => {
    setSelectedSession(session);
    setView('clock');
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setView('session_selection');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <AnimatePresence mode="wait">
          {view === 'session_selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SessionSelectionView onSelect={handleSessionSelect} />
            </motion.div>
          )}
          {view === 'clock' && selectedSession && (
            <motion.div
              key="clock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ClockView 
                selectedSession={selectedSession}
                onAdminClick={() => setView('admin')} 
                onBackClick={handleBackToSessions}
              />
            </motion.div>
          )}
          {view === 'admin' && selectedSession && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminView 
                selectedSession={selectedSession}
                onBackClick={() => setView('clock')} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
