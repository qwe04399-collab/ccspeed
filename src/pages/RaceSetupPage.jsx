import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function formatTime(ms) {
  const value = Number(ms || 0);
  const hours = Math.floor(value / 3600000);
  const minutes = Math.floor((value % 3600000) / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const centiseconds = Math.floor((value % 1000) / 10);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(
    2,
    "0"
  )}`;
}

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
  const [trackRecord, setTrackRecord] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);

  useEffect(() => {
    async function loadTrackRecord() {
      if (!selectedTrack?.id) {
        setTrackRecord(null);
        return;
      }

      setRecordLoading(true);

      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("track_id", selectedTrack.id)
        .order("elapsed_ms", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("賽道紀錄讀取失敗", error);
        setTrackRecord(null);
        setRecordLoading(false);
        return;
      }

      setTrackRecord(data || null);
      setRecordLoading(false);
    }

    loadTrackRecord();
  }, [selectedTrack]);

  const startName =
    trackRecord?.start_name ||
    selectedTrack?.start_name ||
    "起點";

  const finishName =
    trackRecord?.finish_name ||
    selectedTrack?.finish_name ||
    "終點";

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

      <div
        style={{
          border: "1px solid #444",
          borderRadius: 12,
          padding: 16,
          marginBottom: 18,
          background: "#111",
        }}
      >
        <h2 style={{ marginTop: 0 }}>🏆 本賽道紀錄</h2>

        {recordLoading && <p>讀取紀錄中...</p>}

        {!recordLoading && !trackRecord && (
          <p style={{ color: "#aaa" }}>目前尚無成績，等你來創第一筆紀錄。</p>
        )}

        {!recordLoading && trackRecord && (
          <>
            <h3 style={{ fontSize: 24, marginBottom: 6 }}>
              {trackRecord.nickname || "匿名車手"}
            </h3>

            <p style={{ fontSize: 32, fontWeight: "bold", margin: "8px 0" }}>
              {formatTime(trackRecord.elapsed_ms)}
            </p>

            <p style={{ margin: "6px 0" }}>
              {trackRecord.vehicle_type || "未分類"}｜{trackRecord.vehicle_model || "未填車款"}
            </p>

            <p style={{ margin: "6px 0" }}>
              📍 {startName} → {finishName}
            </p>

            <p style={{ margin: "6px 0" }}>
              平均 {Number(trackRecord.avg_speed || 0).toFixed(1)} km/h
              {" ｜ "}
              最高 {Number(trackRecord.max_speed || 0).toFixed(1)} km/h
            </p>
          </>
        )}
      </div>

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
