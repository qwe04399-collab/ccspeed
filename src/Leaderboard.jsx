import { useEffect, useState } from "react";
import { supabase } from "./supabase";

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

const vehicleGroups = [
  { key: "速克達", title: "🛵 速克達組" },
  { key: "檔車", title: "🏍 檔車組" },
  { key: "汽車", title: "🚗 汽車組" },
];

export default function Leaderboard({ onBack }) {
  const [trackGroups, setTrackGroups] = useState({});
  const [loading, setLoading] = useState(true);

  async function loadLeaderboard() {
    setLoading(true);

    const { data, error } = await supabase
      .from("runs")
      .select(`
        *,
        tracks (
          id,
          name
        )
      `)
      .eq("is_valid", true)
      .order("elapsed_ms", { ascending: true });

    if (error) {
      console.error("排行榜讀取失敗", error);
      alert("排行榜讀取失敗：" + error.message);
      setLoading(false);
      return;
    }

    const grouped = {};

    (data || []).forEach((run) => {
      const trackName = run.tracks?.name || "未知賽道";

      if (!grouped[trackName]) {
        grouped[trackName] = [];
      }

      grouped[trackName].push(run);
    });

    setTrackGroups(grouped);
    setLoading(false);
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div style={{ maxWidth: 620, margin: "40px auto", padding: 20 }}>
      <h1>🏆 CCSPEED 排行榜</h1>

      <button
        onClick={onBack}
        style={{ width: "100%", padding: 12, marginBottom: 12 }}
      >
        返回首頁
      </button>

      <button
        onClick={loadLeaderboard}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        重新整理
      </button>

      {loading && <p>讀取中...</p>}

      {!loading && Object.keys(trackGroups).length === 0 && (
        <p>目前沒有成績</p>
      )}

      {!loading &&
        Object.entries(trackGroups).map(([trackName, runs]) => (
          <div
            key={trackName}
            style={{
              border: "2px solid #555",
              borderRadius: 12,
              padding: 16,
              marginBottom: 28,
            }}
          >
            <h2>🏁 {trackName}</h2>

            {["楠西→大埔", "大埔→楠西"].map((direction) => {
              const directionRuns = runs.filter(
                (row) => row.direction === direction
              );

              if (directionRuns.length === 0) return null;

              return (
                <div key={direction} style={{ marginTop: 18 }}>
                  <h3>方向：{direction}</h3>

                  {vehicleGroups.map((group) => {
                    const groupRuns = directionRuns.filter(
                      (row) => row.vehicle_type === group.key
                    );

                    if (groupRuns.length === 0) return null;

                    return (
                      <div key={group.key} style={{ marginTop: 14 }}>
                        <h4>{group.title}</h4>

                        {groupRuns.map((row, index) => (
                          <div
                            key={row.id}
                            style={{
                              border: "1px solid #444",
                              padding: 12,
                              marginBottom: 10,
                              borderRadius: 8,
                              textAlign: "left",
                            }}
                          >
                            <h3>#{index + 1}</h3>
                            <p>暱稱：{row.nickname}</p>
                            <p>車款：{row.vehicle_model}</p>
                            <p>成績：{formatTime(row.elapsed_ms)}</p>
                            <p>
                              平均速度：
                              {Number(row.avg_speed || 0).toFixed(1)} km/h
                            </p>
                            <p>
                              最高速度：
                              {Number(row.max_speed || 0).toFixed(1)} km/h
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}