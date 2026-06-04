export default function RaceSetupPage({
  tracks,
  selectedTrack,
  setSelectedTrack,
  nickname,
  setNickname,
  vehicleType,
  setVehicleType,
  vehicleModel,
  setVehicleModel,
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

      <label>暱稱</label>
      <input
        placeholder="輸入暱稱"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      />

      <label>車輛組別</label>
      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      >
        <option value="速克達">速克達</option>
        <option value="檔車">檔車</option>
        <option value="汽車">汽車</option>
      </select>

      <label>本次車款</label>
      <input
        placeholder="例如：JET SL+ / R15 / GR86"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 10 }}
      />

      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        請輸入本次實際使用車款，車款會顯示於排行榜。
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