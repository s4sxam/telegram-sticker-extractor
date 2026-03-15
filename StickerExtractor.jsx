import { useState, useCallback, useRef } from "react";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

export default function StickerUploader() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState("upload"); // upload | preview | guide
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const extractZip = useCallback(async (file) => {
    setLoading(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const results = [];
      const tasks = [];

      zip.forEach((path, entry) => {
        if (entry.dir) return;
        const lower = path.toLowerCase();
        const isImage = /\.(png|jpg|jpeg|webp|gif)$/.test(lower);
        const isVideo = /\.(mp4|webm|mov)$/.test(lower);
        if (!isImage && !isVideo) return;

        tasks.push(
          entry.async("blob").then((blob) => {
            const ext = lower.split(".").pop();
            const mime = isVideo ? `video/${ext === "mov" ? "mp4" : ext}` : `image/${ext === "jpg" ? "jpeg" : ext}`;
            const typed = new Blob([blob], { type: mime });
            const url = URL.createObjectURL(typed);
            const name = path.split("/").pop();
            results.push({ name, url, type: isVideo ? "video" : "image", blob: typed });
          })
        );
      });

      await Promise.all(tasks);
      results.sort((a, b) => a.name.localeCompare(b.name));
      setStickers(results);
      setPhase("preview");
    } catch (e) {
      alert("Could not read ZIP file. Please try again.");
    }
    setLoading(false);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".zip")) extractZip(f);
    else alert("Please drop a .zip file!");
  };

  const downloadSticker = (sticker) => {
    const a = document.createElement("a");
    a.href = sticker.url;
    a.download = sticker.name.replace(/\.webp$/i, ".png");
    a.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < stickers.length; i++) {
      downloadSticker(stickers[i]);
      await new Promise(r => setTimeout(r, 200));
    }
  };

  // ── STYLES ──
  const s = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
      fontFamily: "'Segoe UI', sans-serif",
      color: "#fff",
      padding: "0 0 60px",
    },
    header: {
      background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)",
      padding: "20px 28px",
      display: "flex", alignItems: "center", gap: 14,
    },
    logo: { fontSize: 32 },
    title: { fontSize: 22, fontWeight: 800, letterSpacing: 0.5 },
    subtitle: { fontSize: 12, opacity: 0.8, marginTop: 2 },
    body: { padding: "32px 24px 0" },
    dropzone: {
      border: `2.5px dashed ${dragging ? "#fcb045" : "#333"}`,
      borderRadius: 20,
      padding: "56px 24px",
      textAlign: "center",
      cursor: "pointer",
      background: dragging ? "rgba(252,176,69,0.07)" : "rgba(255,255,255,0.02)",
      transition: "all 0.2s",
    },
    pill: (color) => ({
      display: "inline-block",
      background: color,
      borderRadius: 20,
      padding: "4px 12px",
      fontSize: 11,
      fontWeight: 700,
      marginRight: 6,
    }),
    card: {
      background: "#1c1c1e",
      border: "1px solid #2a2a2a",
      borderRadius: 16,
      overflow: "hidden",
      cursor: "pointer",
      transition: "transform 0.15s",
    },
    btn: (gradient) => ({
      background: gradient,
      border: "none",
      borderRadius: 12,
      color: "#fff",
      fontWeight: 700,
      fontSize: 14,
      padding: "13px 24px",
      cursor: "pointer",
      transition: "opacity 0.2s",
    }),
    stepBox: {
      background: "#1c1c1e",
      border: "1px solid #2a2a2a",
      borderRadius: 16,
      padding: "18px 20px",
      marginBottom: 14,
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
    },
    stepNum: {
      minWidth: 32, height: 32,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #833ab4, #fd1d1d)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: 14,
    },
  };

  const steps = [
    {
      icon: "📱",
      title: "Open Instagram Story or DM",
      desc: "Go to create a Story, or open any DM/GC and tap the sticker icon 😊",
    },
    {
      icon: "➕",
      title: 'Tap the "+" button',
      desc: "In the sticker tray, tap the + icon (top left) to add a custom sticker from your gallery.",
    },
    {
      icon: "🖼️",
      title: "Pick your downloaded sticker",
      desc: "Select the sticker image you downloaded from this tool — it'll appear in your Recents!",
    },
    {
      icon: "🔁",
      title: "Repeat for each sticker",
      desc: "Once used once, each sticker appears in Recents automatically for quick reuse.",
    },
  ];

  return (
    <div style={s.app}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        .sticker-card:hover { transform: scale(1.04) !important; }
        .dl-btn:hover { opacity: 0.82 !important; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.logo}>✨</div>
        <div>
          <div style={s.title}>Telegram → Instagram Stickers</div>
          <div style={s.subtitle}>Extract your sticker pack & add to Instagram</div>
        </div>
      </div>

      <div style={s.body}>

        {/* PHASE: UPLOAD */}
        {phase === "upload" && (
          <>
            <div
              style={s.dropzone}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current.click()}
            >
              <input ref={fileRef} type="file" accept=".zip" style={{ display: "none" }}
                onChange={e => e.target.files[0] && extractZip(e.target.files[0])} />
              {loading ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 14, display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Extracting stickers...</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 52, marginBottom: 14 }}>{dragging ? "📂" : "📦"}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
                    {dragging ? "Drop it!" : "Drop your Telegram .zip here"}
                  </div>
                  <div style={{ color: "#666", fontSize: 13 }}>or click to browse your files</div>
                  <div style={{ marginTop: 18, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6 }}>
                    {[".png", ".webp", ".gif", ".mp4", ".webm"].map(ext => (
                      <span key={ext} style={s.pill("rgba(131,58,180,0.25)")}>{ext}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* How it works */}
            <div style={{ marginTop: 36 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#aaa" }}>HOW IT WORKS</div>
              {steps.map((step, i) => (
                <div key={i} style={s.stepBox}>
                  <div style={s.stepNum}>{i + 1}</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{step.icon} {step.title}</div>
                    <div style={{ color: "#777", fontSize: 13, lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PHASE: PREVIEW */}
        {phase === "preview" && (
          <>
            {/* Stats bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                🎉 {stickers.length} Stickers Extracted!
              </div>
              <span style={s.pill("rgba(131,58,180,0.3)")}>{stickers.filter(s=>s.type==="image").length} images</span>
              <span style={s.pill("rgba(253,29,29,0.3)")}>{stickers.filter(s=>s.type==="video").length} videos</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button className="dl-btn" style={s.btn("linear-gradient(90deg,#833ab4,#fd1d1d)")} onClick={downloadAll}>
                  ⬇️ Download All
                </button>
                <button className="dl-btn" style={s.btn("#222")} onClick={() => { setStickers([]); setPhase("upload"); }}>
                  ↩ New ZIP
                </button>
              </div>
            </div>

            {/* Instagram guide banner */}
            <div style={{
              background: "linear-gradient(90deg, rgba(131,58,180,0.2), rgba(252,176,69,0.2))",
              border: "1px solid rgba(252,176,69,0.3)",
              borderRadius: 14, padding: "14px 18px", marginBottom: 24,
              display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{ fontSize: 28 }}>📲</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 3 }}>How to add to Instagram</div>
                <div style={{ color: "#aaa", fontSize: 13 }}>
                  Download a sticker → Open Instagram Story/DM → Tap sticker icon → Tap <b>+</b> → Pick from gallery → It's saved in Recents! ✅
                </div>
              </div>
            </div>

            {/* Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 12,
            }}>
              {stickers.map((sticker, i) => (
                <div
                  key={i}
                  className="sticker-card"
                  style={{ ...s.card, animation: `pop 0.3s ease ${i * 0.03}s both` }}
                  onClick={() => downloadSticker(sticker)}
                  title="Click to download"
                >
                  <div style={{
                    width: "100%", height: 110,
                    background: "repeating-conic-gradient(#222 0% 25%, #1a1a1a 0% 50%) 0 0 / 16px 16px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}>
                    {sticker.type === "video" ? (
                      <video src={sticker.url} style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain" }} muted playsInline autoPlay loop />
                    ) : (
                      <img src={sticker.url} alt={sticker.name} style={{ maxHeight: 110, maxWidth: "100%", objectFit: "contain" }} />
                    )}
                  </div>
                  <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                      {sticker.name}
                    </span>
                    <span style={{ fontSize: 15 }}>⬇️</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
    }
