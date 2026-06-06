export default function RaceSetupPage({
  tracks,
  selectedTrack,
  setSelectedTrack,
  vehicleType,
  setVehicleType,
  onStart,
  onBack,
}) {
  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
      <h1>🏁 開始挑戰</h1>

      <button onClick={onBack} style={{ marginBottom: 20 }}>
        返回首頁
      </button>

      <label>選擇賽道</label>
      <select
        value={selectedTrack?.id || ""}
        onChange={(e) => {
          const track = tracks.find((item) => item.id === e.target.value);
          setSelectedTrack(track || null);
        }}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      >
        {tracks.length === 0 && <option value="">沒有可用賽道</option>}

        {tracks.map((track) => (
          <option key={track.id} value={track.id}>
            {track.name}
          </option>
        ))}
      </select>

      {selectedTrack && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <strong>{selectedTrack.name}</strong>
          <p style={{ marginBottom: 0 }}>
            {selectedTrack.start_name || "起點"} → {selectedTrack.finish_name || "終點"}
          </p>
        </div>
      )}

      <label>車輛組別</label>
      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        <option value="速克達">速克達</option>
        <option value="檔車">檔車</option>
        <option value="汽車">汽車</option>
      </select>

      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        暱稱、Mail / 手機、車款會在完成計時後再填，先開始挑戰即可。
      </p>

      <button
        onClick={onStart}
        style={{ width: "100%", padding: 14, fontSize: 18 }}
      >
        開始挑戰
      </button>
    </div>
  );
}
