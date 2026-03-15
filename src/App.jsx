import { useState, useCallback, useRef } from "react";
import JSZip from "jszip";

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function FileCard({ sticker, index, onDownload }) {
  return (
    <div
      onClick={() => onDownload(sticker)}
      title="Click to download"
      style={{
        background: "#1c1c1e",
        border: "1px solid #2a2a2a",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.15s",
        animation: `pop 0.3s ease ${index * 0.03}s both`,
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
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
  );
}

export default function App() {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);
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
            const mime = isVideo
              ? `video/${ext === "mov" ? "mp4" : ext}`
              : `image/${ext === "jpg" ? "jpeg" : ext}`;
            const typed = new Blob([blob], { type: mime });
            const url = URL.createObjectURL(typed);
            const name = path.split("/").pop();
            results.push({ name, url, type: isVideo ? "video" : "image", blob: typed, size: blob.size });
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
    let name = sticker.name;
    if (sticker.type === "image" && name.endsWith(".webp")) name = name.replace(/\.webp$/i, ".png");
    a.download = name;
    a.click();
  };

  const downloadAll = async () => {
    for (const sticker of stickers) {
      downloadSticker(sticker);
      await new Promise(r => setTimeout(r, 200));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const images = stickers.filter(s => s.type === "image");
  const videos = stickers.filter(s => s.type === "video");

  const steps = [
    { icon: "📦", title: "Drop your ZIP file", desc: "Export your Telegram sticker pack as a .zip file and drop it here." },
    { icon: "✨", title: "Stickers get extracted", desc: "All image and video stickers are extracted and previewed instantly." },
    { icon: "⬇️", title: "Download them", desc: "Download all stickers to your device gallery. WebP files are saved as PNG." },
    { icon: "📲", title: "Add to Instagram", desc: "Open Instagram → Story or DM → Sticker icon → tap + → pick from gallery → saved to Recents!" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #833ab4, #fd1d1d, #fcb045)",
        padding: "20px 28px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ fontSize: 32 }}>✨</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Telegram Sticker Extractor</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Extract stickers from .zip and save to your device</div>
        </div>
      </div>

      <div style={{ padding: "32px 24px", maxWidth: 800, margin: "0 auto" }}>

        {phase === "upload" && (
          <>
            {/* Drop Zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2.5px dashed ${dragging ? "#fcb045" : "#333"}`,
                borderRadius: 20, padding: "56px 24px", textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(252,176,69,0.07)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s", marginBottom: 36,
              }}
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
                  <div style={{ color: "#666", fontSize: 13 }}>or click to browse • supports .png .webp .gif .mp4 .webm</div>
                </>
              )}
            </div>

            {/* Steps */}
            <div style={{ fontSize: 14, fontWeight: 700, color: "#888", marginBottom: 16, letterSpacing: 1 }}>HOW IT WORKS</div>
            {steps.map((step, i) => (
              <div key={i} style={{
                background: "#1c1c1e", border: "1px solid #2a2a2a",
                borderRadius: 14, padding: "16px 20px", marginBottom: 12,
                display: "flex", gap: 16, alignItems: "flex-start",
              }}>
                <div style={{
                  minWidth: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg,#833ab4,#fd1d1d)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 13,
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{step.icon} {step.title}</div>
                  <div style={{ color: "#777", fontSize: 13, lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {phase === "preview" && (
          <>
            {/* Stats + Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>🎉 {stickers.length} Stickers Extracted!</div>
              <span style={{ background: "rgba(131,58,180,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                🖼 {images.length} images
              </span>
              <span style={{ background: "rgba(253,29,29,0.3)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                🎬 {videos.length} videos
              </span>
              <span style={{ color: "#444", fontSize: 12, marginLeft: 4 }}>
                {formatSize(stickers.reduce((s, f) => s + f.size, 0))} total
              </span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button onClick={() => { setStickers([]); setPhase("upload"); }}
                  style={{ background: "#222", border: "1px solid #333", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 18px", cursor: "pointer" }}>
                  ↩ New ZIP
                </button>
                <button onClick={downloadAll}
                  style={{ background: saved ? "#1a3a2a" : "linear-gradient(90deg,#833ab4,#fd1d1d)", border: "none", borderRadius: 10, color: saved ? "#6fdd9a" : "#fff", fontWeight: 700, fontSize: 13, padding: "10px 20px", cursor: "pointer" }}>
                  {saved ? "✓ All Saved!" : `⬇️ Download All (${stickers.length})`}
                </button>
              </div>
            </div>

            {/* Instagram tip */}
            <div style={{
              background: "linear-gradient(90deg,rgba(131,58,180,0.15),rgba(252,176,69,0.15))",
              border: "1px solid rgba(252,176,69,0.25)", borderRadius: 14,
              padding: "14px 18px", marginBottom: 24, display: "flex", gap: 12, alignItems: "center",
            }}>
              <div style={{ fontSize: 26 }}>📲</div>
              <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6 }}>
                <b style={{ color: "#fff" }}>To add to Instagram:</b> Download stickers → Open Instagram → Story or DM → tap 😊 → tap <b>+</b> → pick from gallery → appears in Recents ✅
              </div>
            </div>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
              {stickers.map((sticker, i) => (
                <FileCard key={i} sticker={sticker} index={i} onDownload={downloadSticker} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
