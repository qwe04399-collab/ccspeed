import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(
    2,
    "0"
  )}`;
}

function rankLabel(index) {
  if (index === 0) return "🥇 第 1 名";
  if (index === 1) return "🥈 第 2 名";
  if (index === 2) return "🥉 第 3 名";
  return `#${index + 1}`;
}

export default function LeaderboardResults({
  track,
  direction,
  vehicleGroup,
  onBack,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);

      if (!track || !direction || !vehicleGroup) {
        setResults([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .eq("track_id", track.id)
        .eq("direction", direction)
        .eq("vehicle_type", vehicleGroup)
        .order("elapsed_ms", { ascending: true });

      if (error) {
        console.error("排行榜讀取失敗", error);
        alert("排行榜讀取失敗：" + error.message);
        setLoading(false);
        return;
      }

      setResults(data || []);
      setLoading(false);
    }

    loadResults();
  }, [track, direction, vehicleGroup]);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>🏆 排行榜</h1>

      <h2>{track?.name || "未選擇賽道"}</h2>
      <p>方向：{direction || "未選擇"}</p>
      <p>組別：{vehicleGroup || "未選擇"}</p>

      <button
        onClick={onBack}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        返回組別選擇
      </button>

      {loading && <p>讀取中...</p>}

      {!loading && results.length === 0 && <p>目前沒有成績</p>}

      {!loading &&
        results.map((row, index) => (
          <div
            key={row.id}
            style={{
              border: "1px solid #444",
              borderRadius: 8,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <h3>{rankLabel(index)}</h3>
            <p>暱稱：{row.nickname}</p>
            <p>車款：{row.vehicle_model || "未填寫"}</p>
            <p>成績：{formatTime(row.elapsed_ms || 0)}</p>
            <p>平均速度：{Number(row.avg_speed || 0).toFixed(1)} km/h</p>
            <p>最高速度：{Number(row.max_speed || 0).toFixed(1)} km/h</p>
          </div>
        ))}
    </div>
  );
}
