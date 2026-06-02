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

const directions = ["楠西→大埔", "大埔→楠西"];

const vehicleGroups = [
  { key: "速克達", title: "🛵 速克達組" },
  { key: "檔車", title: "🏍 檔車組" },
  { key: "汽車", title: "🚗 汽車組" },
];

export default function Leaderboard() {
  const [selectedDirection, setSelectedDirection] = useState("楠西→大埔");
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("runs")
      .select("*")
      .eq("direction", selectedDirection)
      .eq("is_valid", true)
      .order("elapsed_ms", { ascending: true });

    if (error) {
      console.error("排行榜讀取失敗", error);
      setLoading(false);
      return;
    }

    setRuns(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedDirection]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 20 }}>
      <h1>🏆 CCSPEED 排行榜</h1>

      <h2>楠西 ↔ 大埔</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {directions.map((dir) => (
          <button
            key={dir}
            onClick={() => setSelectedDirection(dir)}
            style={{
              flex: 1,
              padding: 12,
              fontSize: 16,
              fontWeight: selectedDirection === dir ? "bold" : "normal",
              border:
                selectedDirection === dir
                  ? "2px solid #fff"
                  : "1px solid #555",
              borderRadius: 8,
            }}
          >
            {dir}
          </button>
        ))}
      </div>

      <button
        onClick={loadLeaderboard}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        重新整理
      </button>

      {loading && <p>讀取中...</p>}

      {!loading &&
        vehicleGroups.map((group) => {
          const groupRuns = runs.filter(
            (row) => row.vehicle_type === group.key
          );

          return (
            <div key={group.key} style={{ marginBottom: 28 }}>
              <h2>{group.title}</h2>

              {groupRuns.length === 0 && <p>目前沒有成績</p>}

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
                    {row.avg_speed
                      ? Number(row.avg_speed).toFixed(1)
                      : "0.0"}{" "}
                    km/h
                  </p>
                  <p>
                    最高速度：
                    {row.max_speed
                      ? Number(row.max_speed).toFixed(1)
                      : "0.0"}{" "}
                    km/h
                  </p>
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}