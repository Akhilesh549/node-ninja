import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const API_BASE = "http://localhost:5000/api";
const STORAGE_KEY = "eco-dashboard-profile-v2";

const CATEGORY_META = {
  plastic: {
    label: "Plastic",
    icon: "🧴",
    color: "#2d9cdb",
    bin: "Recyclable Bin"
  },
  organic: {
    label: "Organic",
    icon: "🍃",
    color: "#27ae60",
    bin: "Organic Bin"
  },
  metal: {
    label: "Metal",
    icon: "🔩",
    color: "#f1c40f",
    bin: "Recyclable Bin"
  },
  glass: {
    label: "Glass",
    icon: "🫙",
    color: "#95a5a6",
    bin: "Recyclable Bin"
  }
};

const REWARD_THRESHOLDS = [
  { points: 100, title: "Seed Pack", icon: "🌱" },
  { points: 250, title: "Reusable Bottle", icon: "🚰" },
  { points: 500, title: "Eco Gift Card", icon: "🎁" }
];

const DEFAULT_PROFILE = {
  scans: 0,
  points: 0,
  coins: 0,
  carbonCredits: 0,
  streak: 0,
  lastScanDate: "",
  claimedRewards: [],
  badges: []
};

const DEFAULT_STATS = {
  totalItems: 0,
  organicCount: 0,
  nonOrganicCount: 0,
  recyclableCount: 0,
  nonRecyclableCount: 0,
  totalPoints: 0,
  totalCarbonCredits: 0,
  breakdown: { plastic: 0, organic: 0, metal: 0, glass: 0 }
};

const seedLeaderboard = [
  { name: "EcoLily", points: 860, streak: 18, badge: "Green Hero" },
  { name: "WasteWizard", points: 720, streak: 14, badge: "Eco Warrior" },
  { name: "RecyclePro", points: 610, streak: 11, badge: "Carbon Captain" }
];

const THEME = {
  pageBg: "#06111f",
  pageBgSoft: "#0f1b2d",
  surface: "rgba(13, 24, 42, 0.78)",
  surfaceStrong: "rgba(16, 30, 50, 0.92)",
  border: "rgba(148, 163, 184, 0.16)",
  text: "#e8eef8",
  muted: "#9fb2c8",
  accent: "#2ecc71",
  accentAlt: "#2d9cdb",
  warning: "#f1c40f",
  danger: "#eb5757"
};

const normalizeCategory = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "paper" || raw === "cardboard" || raw === "paperboard") {
    return "organic";
  }
  if (["plastic", "organic", "metal", "glass"].includes(raw)) {
    return raw;
  }
  return "organic";
};

const getDisplayCategory = (value) => {
  const normalized = normalizeCategory(value);
  return {
    key: normalized,
    ...CATEGORY_META[normalized]
  };
};

const isRecyclableCategory = (category) => ["plastic", "metal", "glass"].includes(normalizeCategory(category));

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatDateTime = (value) => {
  if (!value) return "Just now";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString();
};

const buildVoiceSummary = (detections, warning) => {
  const primary = detections[0];
  const categoryList = detections.map((d) => getDisplayCategory(d.category).label).join(", ");
  const confidenceText = `${Math.round((primary.confidence || 0) * 100)} percent confidence`;
  const base = detections.length > 1
    ? `Multiple objects detected: ${categoryList}.`
    : `${getDisplayCategory(primary.category).label} detected with ${confidenceText}.`;
  return warning ? `${base} Warning: ${warning}` : base;
};

const getEcoMessage = (detections, confidence) => {
  if (detections.length > 1) {
    return "Great job checking multiple items at once. Small actions scale into big environmental wins.";
  }
  if (confidence >= 0.9) {
    return "Excellent detection. Keep the streak alive and stay eco sharp.";
  }
  if (confidence >= 0.75) {
    return "Solid scan. A little more recycling awareness goes a long way.";
  }
  return "Nice try. Scan again with better lighting or upload a clearer image.";
};

const loadProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
};

const saveProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage failures
  }
};

function Dashboard({ onLogout }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [currentTab, setCurrentTab] = useState("scan");
  const [scanMode, setScanMode] = useState("camera");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedBin, setSelectedBin] = useState("auto");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [profile, setProfile] = useState(loadProfile);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("Ready to scan waste.");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);
  const [rewardNotice, setRewardNotice] = useState("");
  const [note, setNote] = useState("");

  const speak = useCallback((text) => {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance === "undefined") {
      console.warn("Speech synthesis is not available in this browser.");
      return;
    }

    const synth = window.speechSynthesis;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synth.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find((voice) => /en/i.test(voice.lang) || /en/i.test(voice.name));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    synth.cancel();
    if (typeof synth.resume === "function") {
      synth.resume();
    }

    window.setTimeout(() => {
      synth.speak(utterance);
    }, 120);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      setStats({
        ...DEFAULT_STATS,
        ...data,
        breakdown: { ...DEFAULT_STATS.breakdown, ...(data.breakdown || {}) }
      });
      setNote(data.note || "");
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      setHistory(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([fetchStats(), fetchHistory()]);
    })();
  }, [fetchStats, fetchHistory]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const leaderboard = useMemo(() => {
    const currentUser = {
      name: "You",
      points: profile.points,
      streak: profile.streak,
      badge: profile.badges[0] || "Just Starting"
    };

    return [...seedLeaderboard, currentUser]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [profile]);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isCameraOn || !videoRef.current || !cameraStreamRef.current) return;

    const video = videoRef.current;
    video.srcObject = cameraStreamRef.current;
    video.play().catch((err) => {
      console.log("Camera play warning:", err.message);
    });
  }, [isCameraOn]);

  const categoriesChartData = useMemo(() => {
    return Object.entries(stats.breakdown || {}).map(([key, value]) => ({
      category: getDisplayCategory(key).label,
      key,
      count: value,
      fill: CATEGORY_META[normalizeCategory(key)].color
    }));
  }, [stats.breakdown]);

  const metricCards = useMemo(() => ([
    { label: "Total waste scanned", value: stats.totalItems || history.length, accent: "#2d9cdb" },
    { label: "Organic count", value: stats.organicCount ?? stats.breakdown.organic ?? 0, accent: "#27ae60" },
    { label: "Non-organic count", value: stats.nonOrganicCount ?? 0, accent: "#f1c40f" },
    { label: "Recyclable count", value: stats.recyclableCount ?? 0, accent: "#56ccf2" },
    { label: "Non-recyclable count", value: stats.nonRecyclableCount ?? 0, accent: "#eb5757" }
  ]), [history.length, stats]);

  const updateStreak = useCallback((prevProfile) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (prevProfile.lastScanDate === today) {
      return prevProfile;
    }

    if (prevProfile.lastScanDate === yesterday) {
      return { ...prevProfile, streak: prevProfile.streak + 1, lastScanDate: today };
    }

    return { ...prevProfile, streak: 1, lastScanDate: today };
  }, []);

  const recalculateBadges = useCallback((nextProfile) => {
    const badges = [];
    if (nextProfile.points >= 50) badges.push("Green Hero");
    if (nextProfile.points >= 150) badges.push("Eco Warrior");
    if (nextProfile.streak >= 5) badges.push("Daily Saver");
    if (nextProfile.carbonCredits >= 10) badges.push("Carbon Captain");
    return badges;
  }, []);

  const awardProfile = useCallback((detections) => {
    const detectionCount = detections.length;
    const scanPoints = detections.reduce((sum, item) => sum + Math.max(10, Math.round((item.confidence || 0.7) * 20)), 0);
    const carbonCredits = detections.reduce((sum, item) => sum + (item.recyclable ? 0.3 : 0.15), 0);
    const coins = detections.reduce((sum, item) => sum + (item.recyclable ? 5 : 3), 0);

    setProfile((prev) => {
      const afterStreak = updateStreak(prev);
      const next = {
        ...afterStreak,
        scans: afterStreak.scans + detectionCount,
        points: afterStreak.points + scanPoints,
        coins: afterStreak.coins + coins,
        carbonCredits: Number((afterStreak.carbonCredits + carbonCredits).toFixed(2))
      };
      const badges = recalculateBadges(next);
      return { ...next, badges };
    });
  }, [recalculateBadges, updateStreak]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    setError("");
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      cameraStreamRef.current = mediaStream;
      setIsCameraOn(true);
      setScanMode("camera");
      setMessage("Camera is live. Frame the item and scan.");
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(`Could not access camera: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setScanMode("upload");
    setIsCameraOn(false);
    stopCamera();

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setMessage("Image loaded. Tap classify to analyze it.");
  };

  const getImageFile = async () => {
    if (scanMode === "upload") {
      if (!selectedFile) throw new Error("Please upload an image first.");
      return selectedFile;
    }

    if (!videoRef.current || !canvasRef.current || !isCameraOn) {
      throw new Error("Start the camera first.");
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to read camera frame.");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error("Could not capture image.");
    return new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
  };

  const parseApiResult = (data) => {
    const rawDetections = Array.isArray(data?.detections)
      ? data.detections
      : Array.isArray(data?.detectedItems)
        ? data.detectedItems
        : Array.isArray(data?.results)
          ? data.results
          : [data];

    const detections = rawDetections.map((item, index) => {
      const category = normalizeCategory(item?.category || item?.label);
      const meta = getDisplayCategory(category);
      const confidence = safeNumber(item?.confidence ?? data?.confidence, 0.75);
      const recyclable = typeof item?.recyclable === "boolean" ? item.recyclable : isRecyclableCategory(category);
      return {
        id: item?.id || `${category}-${index}`,
        category,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        bin: recyclable ? "Recyclable Bin" : "Organic Bin",
        confidence,
        recyclable,
        tip: item?.tip || data?.tip || (recyclable
          ? "Rinse and sort into recycling."
          : "Send to compost or organic waste processing.")
      };
    });

    const primary = detections[0] || {
      category: "organic",
      label: "Organic",
      icon: "🍃",
      color: CATEGORY_META.organic.color,
      confidence: 0.7,
      recyclable: false,
      bin: "Organic Bin",
      tip: "Place in organic waste."
    };

    const recommendedBin = primary.recyclable ? "recyclable" : "organic";
    const wrongBin = selectedBin !== "auto" && selectedBin !== recommendedBin;

    return {
      detections,
      primary,
      confidence: primary.confidence,
      recyclable: primary.recyclable,
      wrongBin,
      warning: wrongBin
        ? `Wrong bin detected. You selected ${selectedBin}, but this item belongs in ${primary.bin}.`
        : "",
      ecoMessage: getEcoMessage(detections, primary.confidence),
      totalPoints: safeNumber(data?.points, detections.length * 10),
      carbonCredits: safeNumber(data?.carbonCredits, detections.length * 0.25)
    };
  };

  const notifySuccess = (result) => {
    const summary = buildVoiceSummary(result.detections, result.warning);
    speak(summary);
    setShowConfetti(true);
    setConfettiSeed((n) => n + 1);
    window.setTimeout(() => setShowConfetti(false), 3200);
    setMessage(result.ecoMessage);
    setRewardNotice(result.warning || "Scan successful. Nice eco call.");
  };

  const handleClassify = async () => {
    setError("");
    setCameraError("");
    setRewardNotice("");
    setIsScanning(true);

    try {
      const file = await getImageFile();
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_BASE}/classify-waste`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        throw new Error("Classification failed.");
      }

      const data = await res.json();
      const parsed = parseApiResult(data);
      setScanResult(parsed);
      awardProfile(parsed.detections);
      notifySuccess(parsed);
      await Promise.all([fetchHistory(), fetchStats()]);
    } catch (err) {
      console.error("Classification error:", err);
      setError(err.message || "Failed to classify waste.");
    } finally {
      setIsScanning(false);
    }
  };

  const claimReward = (reward) => {
    if (profile.claimedRewards.includes(reward.points)) return;
    setProfile((prev) => ({
      ...prev,
      claimedRewards: [...prev.claimedRewards, reward.points],
      coins: prev.coins + reward.points / 2
    }));
    setRewardNotice(`Reward claimed: ${reward.title}.`);
  };

  const previewStyle = scanMode === "camera"
    ? { background: "#09111f" }
    : { backgroundImage: previewUrl ? `url(${previewUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center" };

  const recentScans = history.slice(0, 6);
  const primaryScan = scanResult?.primary;
  const successRate = stats.totalItems > 0
    ? Math.round((stats.recyclableCount / stats.totalItems) * 100)
    : 0;
  const badgeCount = profile.badges.length;

  return (
    <div style={{
      minHeight: "100vh",
      background: `radial-gradient(circle at top left, rgba(46, 204, 113, 0.18), transparent 26%),
        radial-gradient(circle at top right, rgba(45, 156, 219, 0.2), transparent 24%),
        radial-gradient(circle at 50% 100%, rgba(241, 196, 15, 0.08), transparent 26%),
        linear-gradient(180deg, ${THEME.pageBg} 0%, ${THEME.pageBgSoft} 48%, #07101d 100%)`,
      color: THEME.text,
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.22,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.6), transparent 95%)"
      }} />

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(95vh) rotate(720deg); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.35); }
          50% { transform: scale(1.01); box-shadow: 0 0 0 12px rgba(46, 204, 113, 0); }
        }
        @keyframes floatBlob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(0, -18px, 0) scale(1.04); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dashboard-hero {
          animation: fadeUp 0.6s ease both;
        }
        .glass-panel {
          background: ${THEME.surface};
          border: 1px solid ${THEME.border};
          backdrop-filter: blur(18px);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
        }
        .lift-card {
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }
        .lift-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 22px 55px rgba(0, 0, 0, 0.18);
          border-color: rgba(46, 204, 113, 0.28);
        }
        .soft-button {
          transition: transform 180ms ease, filter 180ms ease, background 180ms ease;
        }
        .soft-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.06);
        }
      `}</style>

      <div style={{
        position: "absolute",
        top: "90px",
        left: "-80px",
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        background: "rgba(46, 204, 113, 0.15)",
        filter: "blur(20px)",
        animation: "floatBlob 8s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute",
        top: "140px",
        right: "-60px",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: "rgba(45, 156, 219, 0.18)",
        filter: "blur(24px)",
        animation: "floatBlob 10s ease-in-out infinite"
      }} />

      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2000 }}>
          {Array.from({ length: 28 }).map((_, index) => {
            const palette = ["#27ae60", "#2d9cdb", "#f1c40f", "#eb5757", "#ffffff"];
            const left = (index * 7) % 100;
            const delay = (index % 6) * 0.08;
            return (
              <div
                key={`${confettiSeed}-${index}`}
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: `${left}%`,
                  width: "10px",
                  height: "18px",
                  background: palette[index % palette.length],
                  opacity: 0.9,
                  borderRadius: "2px",
                  animation: `confettiFall ${2.4 + (index % 3) * 0.2}s linear ${delay}s forwards`
                }}
              />
            );
          })}
        </div>
      )}

      <header style={{
        padding: "28px 22px 18px",
        color: "#fff",
        background: "linear-gradient(135deg, rgba(5, 14, 25, 0.95), rgba(12, 24, 42, 0.98))",
        boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }} className="dashboard-hero">
          <div>
            <div style={{ fontSize: "15px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(232,238,248,0.7)" }}>
              Eco intelligence center
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.03em", marginTop: "6px" }}>
              ♻️ Waste Segregation AI
            </div>
            <div style={{ opacity: 0.84, marginTop: "8px", maxWidth: "680px", lineHeight: 1.55 }}>
              Scan waste, see confidence, get voice guidance, and track eco performance with a cleaner, more professional dashboard.
            </div>
          </div>
        <div style={{
          padding: "12px 18px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.11)",
          backdropFilter: "blur(12px)",
          minWidth: "160px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <div>
            <div style={{ fontSize: "13px", opacity: 0.7 }}>Current streak</div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{profile.streak} days</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="soft-button"
            style={{
              border: "none",
              cursor: "pointer",
              padding: "10px 14px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #eb5757, #ff7a7a)",
              color: "#fff",
              fontWeight: 800,
              whiteSpace: "nowrap"
            }}
          >
            Logout
          </button>
        </div>
      </div>

        <div style={{
          maxWidth: "1400px",
          margin: "20px auto 0",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap"
        }}>
          {["scan", "stats", "history", "rewards", "leaderboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "11px 18px",
                borderRadius: "999px",
                color: "#fff",
                background: currentTab === tab ? "linear-gradient(135deg, #27ae60, #2ecc71)" : "rgba(255,255,255,0.08)",
                boxShadow: currentTab === tab ? "0 10px 25px rgba(39,174,96,0.25)" : "none"
              }}
              className="soft-button"
            >
              {tab === "scan" && "📷 Scan"}
              {tab === "stats" && "📊 Stats"}
              {tab === "history" && "🕒 History"}
              {tab === "rewards" && "🏆 Rewards"}
              {tab === "leaderboard" && "🥇 Leaderboard"}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 18px 40px", position: "relative", zIndex: 1 }}>
        {note && (
          <div style={{
            marginBottom: "18px",
            padding: "14px 16px",
            borderRadius: "16px",
            background: "rgba(255, 244, 214, 0.98)",
            color: "#8a5a00",
            border: "1px solid #f3d27a",
            boxShadow: "0 12px 28px rgba(0,0,0,0.08)"
          }}>
            {note}
          </div>
        )}

        {currentTab === "scan" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", alignItems: "start" }}>
            <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800 }}>Scan controls</div>
                  <div style={{ color: THEME.muted, marginTop: "6px" }}>Choose camera or upload, then classify.</div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setScanMode("camera")}
                    className="soft-button"
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      background: scanMode === "camera" ? "linear-gradient(135deg, #27ae60, #2ecc71)" : "rgba(255,255,255,0.08)",
                      color: "#fff"
                    }}
                  >
                    📷 Camera
                  </button>
                  <button
                    onClick={() => setScanMode("upload")}
                    className="soft-button"
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      background: scanMode === "upload" ? "linear-gradient(135deg, #102033, #314766)" : "rgba(255,255,255,0.08)",
                      color: "#fff"
                    }}
                  >
                    🖼 Upload
                  </button>
                  <button
                    onClick={openFilePicker}
                    className="soft-button"
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      background: "linear-gradient(135deg, #2d9cdb, #56ccf2)",
                      color: "#fff"
                    }}
                  >
                    Choose File
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginTop: "18px" }}>
                <div style={{ padding: "14px 16px", borderRadius: "18px", background: "rgba(46, 204, 113, 0.08)", border: "1px solid rgba(46, 204, 113, 0.12)" }}>
                  <div style={{ fontSize: "12px", color: THEME.muted }}>Confidence</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: THEME.text }}>{primaryScan ? `${Math.round((primaryScan.confidence || 0) * 100)}%` : "—"}</div>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "18px", background: "rgba(45, 156, 219, 0.08)", border: "1px solid rgba(45, 156, 219, 0.12)" }}>
                  <div style={{ fontSize: "12px", color: THEME.muted }}>Success rate</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: THEME.text }}>{successRate}%</div>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "18px", background: "rgba(241, 196, 15, 0.09)", border: "1px solid rgba(241, 196, 15, 0.12)" }}>
                  <div style={{ fontSize: "12px", color: THEME.muted }}>Badges</div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: THEME.text }}>{badgeCount}</div>
                </div>
              </div>

              <div style={{
                marginTop: "18px",
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                maxHeight: "300px",
                borderRadius: "22px",
                overflow: "hidden",
                background: scanMode === "camera" ? "#07101d" : "#f2f5fa",
                border: "1px solid rgba(148, 163, 184, 0.16)"
              }}>
                {scanMode === "camera" && (
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(46, 204, 113, 0.02), rgba(45, 156, 219, 0.06))"
                  }} />
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: scanMode === "camera" ? "block" : "none"
                  }}
                />

                {scanMode === "upload" && previewUrl && (
                  <div style={{ ...previewStyle, width: "100%", height: "100%" }} />
                )}

                {scanMode === "camera" && !isCameraOn && (
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", textAlign: "center", padding: "20px" }}>
                    <div>
                      <div style={{ fontSize: "58px" }}>📹</div>
                      <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "8px" }}>Camera is off</div>
                      <div style={{ opacity: 0.78, marginTop: "6px" }}>Start the camera to capture an item.</div>
                    </div>
                  </div>
                )}

                <div style={{
                  position: "absolute",
                  inset: "14px",
                  borderRadius: "16px",
                  border: "2px solid rgba(45, 156, 219, 0.55)",
                  pointerEvents: "none"
                }} />

                <div style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "rgba(7,16,29,0.65)",
                  color: "#fff",
                  fontSize: "12px"
                }}>
                  {scanMode === "camera" ? (isCameraOn ? "LIVE" : "READY") : "UPLOAD"}
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ fontWeight: 700, color: THEME.text }}>Bin placed in:</label>
                <select
                  value={selectedBin}
                  onChange={(e) => setSelectedBin(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                    background: "rgba(255,255,255,0.92)",
                    color: "#102033"
                  }}
                >
                  <option value="auto">Auto check</option>
                  <option value="organic">Organic Bin</option>
                  <option value="recyclable">Recyclable Bin</option>
                </select>
              </div>

              <canvas ref={canvasRef} style={{ display: "none" }} />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "18px" }}>
                <button
                  onClick={startCamera}
                  className="soft-button"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "14px 20px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
                    color: "#fff",
                    fontWeight: 700
                  }}
                >
                  🎬 Start Camera
                </button>
                <button
                  onClick={stopCamera}
                  className="soft-button"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "14px 20px",
                    borderRadius: "16px",
                    background: "#eb5757",
                    color: "#fff",
                    fontWeight: 700
                  }}
                >
                  ⛔ Stop Camera
                </button>
                <button
                  onClick={handleClassify}
                  disabled={isScanning}
                  className="soft-button"
                  style={{
                    border: "none",
                    cursor: isScanning ? "not-allowed" : "pointer",
                    padding: "14px 20px",
                    borderRadius: "16px",
                    background: isScanning ? "#94a3b8" : "#102033",
                    color: "#fff",
                    fontWeight: 700
                  }}
                >
                  {isScanning ? "🔄 Scanning..." : "✨ Classify Waste"}
                </button>
              </div>

              {cameraError && (
                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "14px", background: "#ffe8e8", color: "#c0392b" }}>
                  {cameraError}
                </div>
              )}

              {error && (
                <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "14px", background: "#ffe8e8", color: "#c0392b" }}>
                  {error}
                </div>
              )}
            </section>

            <aside className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
              <div style={{ fontSize: "14px", letterSpacing: "0.18em", textTransform: "uppercase", color: THEME.muted }}>Result panel</div>
              <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>Live result</div>
              <div style={{ color: THEME.muted, marginTop: "6px" }}>{message}</div>

              {primaryScan ? (
                <div style={{ marginTop: "18px", display: "grid", gap: "14px" }}>
                  <div className="lift-card" style={{ background: "rgba(255,255,255,0.05)", borderRadius: "22px", padding: "18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "42px" }}>{getDisplayCategory(primaryScan.category).icon}</div>
                    <div style={{ fontSize: "26px", fontWeight: 800, marginTop: "6px" }}>{getDisplayCategory(primaryScan.category).label}</div>
                    <div style={{ marginTop: "10px", fontSize: "16px" }}>
                      Confidence: <strong>{Math.round((primaryScan.confidence || 0) * 100)}%</strong>
                    </div>
                    <div style={{
                      marginTop: "10px",
                      display: "inline-flex",
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: primaryScan.recyclable ? "rgba(39,174,96,0.18)" : "rgba(235,87,87,0.18)",
                      color: "#fff"
                    }}>
                      {primaryScan.recyclable ? "♻️ Recyclable" : "🍃 Organic / Non-recyclable"}
                    </div>
                    <div style={{ marginTop: "14px", color: "rgba(255,255,255,0.82)" }}>{primaryScan.tip}</div>
                    <div style={{ marginTop: "14px", fontSize: "13px", color: "rgba(255,255,255,0.72)" }}>
                      Suggested bin: {primaryScan.bin}
                    </div>
                  </div>

                  {scanResult?.warning && (
                    <div style={{ padding: "12px 14px", borderRadius: "18px", background: "#fff3cd", color: "#8a5a00" }}>
                      ⚠️ Wrong bin detected. {scanResult.warning}
                    </div>
                  )}

                  <div style={{ padding: "14px", borderRadius: "18px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>Voice note</div>
                    <div style={{ color: "rgba(255,255,255,0.78)" }}>
                      Detected result spoken after each successful scan.
                    </div>
                  </div>

                  <div style={{ padding: "14px", borderRadius: "18px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>Multi-object detection</div>
                    <div style={{ color: "rgba(255,255,255,0.78)" }}>
                      {scanResult.detections.length} item(s) detected in this scan.
                    </div>
                    <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
                      {scanResult.detections.map((item) => (
                        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "14px", background: "rgba(255,255,255,0.06)" }}>
                          <span>{item.icon} {item.label}</span>
                          <span>{Math.round(item.confidence * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "22px", minHeight: "280px", display: "grid", placeItems: "center", textAlign: "center", color: "rgba(255,255,255,0.7)" }}>
                  <div>
                    <div style={{ fontSize: "58px" }}>📸</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "10px" }}>No scan yet</div>
                    <div style={{ marginTop: "6px" }}>
                      Upload or capture an image to see classification results.
                    </div>
                  </div>
                </div>
              )}

              {rewardNotice && (
                <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "16px", background: "rgba(255,255,255,0.08)" }}>
                  {rewardNotice}
                </div>
              )}
            </aside>
          </div>
        )}

        {currentTab === "stats" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
              {metricCards.map((card) => (
                <div key={card.label} style={{
                  background: "rgba(13, 24, 42, 0.88)",
                  borderRadius: "22px",
                  padding: "20px",
                  boxShadow: "0 16px 36px rgba(0, 0, 0, 0.22)",
                  borderTop: `4px solid ${card.accent}`,
                  border: "1px solid rgba(148, 163, 184, 0.14)"
                }}>
                  <div style={{ color: "rgba(232, 238, 248, 0.72)", fontSize: "14px", fontWeight: 700 }}>{card.label}</div>
                  <div style={{ fontSize: "36px", fontWeight: 900, marginTop: "10px", color: card.accent }}>
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px", marginTop: "18px" }}>
              <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
                <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>Pie chart</div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoriesChartData} dataKey="count" nameKey="category" innerRadius={70} outerRadius={110} paddingAngle={2}>
                      {categoriesChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </section>

              <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
                <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>Bar chart</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                      {categoriesChartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </div>
          </div>
        )}

        {currentTab === "history" && (
          <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
            <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "14px" }}>Recent scan history</div>
            {recentScans.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: "860px",
                  background: "rgba(13, 24, 42, 0.82)",
                  border: "1px solid rgba(148, 163, 184, 0.14)",
                  borderRadius: "18px",
                  overflow: "hidden"
                }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                      {["#", "Item", "Category", "Confidence", "Bin", "Tip", "Date & Time"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: "left",
                            padding: "14px 16px",
                            fontSize: "13px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(232, 238, 248, 0.74)",
                            borderBottom: "1px solid rgba(148, 163, 184, 0.14)"
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentScans.map((item, index) => {
                      const meta = getDisplayCategory(item.category);
                      const confidence = safeNumber(item.confidence, 0);
                      const recyclable = typeof item.recyclable === "boolean" ? item.recyclable : isRecyclableCategory(item.category);
                      return (
                        <tr key={item.id} style={{ background: index % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}>
                            {index + 1}
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "12px",
                                display: "grid",
                                placeItems: "center",
                                background: `${meta.color}20`,
                                fontSize: "22px"
                              }}>
                                {meta.icon}
                              </span>
                              <span style={{ fontWeight: 800, color: "#f5f9ff" }}>{meta.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}>
                            {meta.label}
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)", fontWeight: 800 }}>
                            {Math.round(confidence * 100)}%
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)" }}>
                            <span style={{
                              display: "inline-flex",
                              padding: "8px 12px",
                              borderRadius: "999px",
                              background: recyclable ? "rgba(39, 174, 96, 0.16)" : "rgba(235, 87, 87, 0.16)",
                              color: recyclable ? "#73e29e" : "#ff9d9d",
                              border: `1px solid ${recyclable ? "rgba(39, 174, 96, 0.24)" : "rgba(235, 87, 87, 0.24)"}`
                            }}>
                              {recyclable ? "Recyclable Bin" : "Organic Bin"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)", color: "rgba(232, 238, 248, 0.86)" }}>
                            {item.tip}
                          </td>
                          <td style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148, 163, 184, 0.08)", color: "rgba(232, 238, 248, 0.78)", whiteSpace: "nowrap" }}>
                            {formatDateTime(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: "rgba(232, 238, 248, 0.72)", padding: "24px 0" }}>No history yet. Start scanning waste to build your timeline.</div>
            )}
          </section>
        )}

        {currentTab === "rewards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>User rewards</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginTop: "14px" }}>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(46, 204, 113, 0.08)", border: "1px solid rgba(46, 204, 113, 0.12)" }}>
                  <div style={{ color: "rgba(232, 238, 248, 0.72)" }}>Points</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#27ae60" }}>{profile.points}</div>
                </div>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(45, 156, 219, 0.08)", border: "1px solid rgba(45, 156, 219, 0.12)" }}>
                  <div style={{ color: "rgba(232, 238, 248, 0.72)" }}>Coins</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#2d9cdb" }}>{profile.coins}</div>
                </div>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(241, 196, 15, 0.08)", border: "1px solid rgba(241, 196, 15, 0.12)" }}>
                  <div style={{ color: "rgba(232, 238, 248, 0.72)" }}>Carbon credits</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#f1c40f" }}>{profile.carbonCredits.toFixed(2)}</div>
                </div>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(235, 87, 87, 0.08)", border: "1px solid rgba(235, 87, 87, 0.12)" }}>
                  <div style={{ color: "rgba(232, 238, 248, 0.72)" }}>Scans</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#eb5757" }}>{profile.scans}</div>
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div style={{ fontWeight: 800, marginBottom: "8px" }}>Badges</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {profile.badges.length > 0 ? profile.badges.map((badge) => (
                    <span key={badge} style={{ padding: "8px 12px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {badge}
                    </span>
                  )) : (
                    <span style={{ color: "rgba(232, 238, 248, 0.72)" }}>Keep scanning to unlock badges like Green Hero and Eco Warrior.</span>
                  )}
                </div>
              </div>
            </section>

            <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
              <div style={{ fontSize: "22px", fontWeight: 800 }}>Redeem rewards</div>
              <div style={{ color: "rgba(232, 238, 248, 0.72)", marginTop: "6px" }}>Unlock gifts after reaching thresholds.</div>
              <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
                {REWARD_THRESHOLDS.map((reward) => {
                  const claimed = profile.claimedRewards.includes(reward.points);
                  const unlocked = profile.points >= reward.points;
                  return (
                    <div key={reward.points} style={{
                      padding: "16px",
                      borderRadius: "18px",
                      border: "1px solid rgba(148, 163, 184, 0.14)",
                      background: unlocked ? "rgba(46, 204, 113, 0.08)" : "rgba(255,255,255,0.05)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div>
                          <div style={{ fontWeight: 800 }}>{reward.icon} {reward.title}</div>
                          <div style={{ color: "rgba(232, 238, 248, 0.72)", marginTop: "4px" }}>{reward.points} points required</div>
                        </div>
                        <button
                          onClick={() => claimReward(reward)}
                          disabled={!unlocked || claimed}
                          style={{
                            border: "none",
                            borderRadius: "999px",
                            padding: "10px 14px",
                            cursor: unlocked && !claimed ? "pointer" : "not-allowed",
                            background: claimed ? "#94a3b8" : unlocked ? "#27ae60" : "#cbd5e1",
                            color: "#fff"
                          }}
                        >
                          {claimed ? "Claimed" : unlocked ? "Redeem" : "Locked"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {currentTab === "leaderboard" && (
            <section className="glass-panel lift-card" style={{ borderRadius: "26px", padding: "22px", color: THEME.text }}>
            <div style={{ fontSize: "22px", fontWeight: 800 }}>Leaderboard</div>
            <div style={{ color: "rgba(232, 238, 248, 0.72)", marginTop: "6px" }}>Top eco champions this session.</div>
            <div style={{ display: "grid", gap: "12px", marginTop: "14px" }}>
              {leaderboard.map((user, index) => (
                <div key={`${user.name}-${index}`} style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "12px",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "18px",
                  background: index === 0 ? "rgba(46, 204, 113, 0.08)" : "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(148, 163, 184, 0.14)"
                }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "14px", display: "grid", placeItems: "center", background: index === 0 ? "#27ae60" : "rgba(255,255,255,0.1)", color: "#fff", fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: "#f5f9ff" }}>{user.name}</div>
                    <div style={{ color: "rgba(232, 238, 248, 0.72)", marginTop: "4px" }}>{user.badge}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900 }}>{user.points} pts</div>
                    <div style={{ color: "rgba(232, 238, 248, 0.72)", marginTop: "4px" }}>{user.streak} day streak</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
