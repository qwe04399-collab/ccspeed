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

export default function Leaderboard() {
  const [motorcycle, setMotorcycle] = useState([]);
  const [car, setCar] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("time_ms", { ascending: true });

    if (error) {
      console.error("排行榜讀取失敗", error);
      setLoading(false);
      return;
    }

    setMotorcycle(data.filter((item) => item.vehicle_type === "機車"));
    setCar(data.filter((item) => item.vehicle_type === "汽車"));
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>🏆 CCSPEED 排行榜</h1>

      <button onClick={loadLeaderboard}>重新整理</button>

      {loading && <p>讀取中...</p>}

      <h2>🏍 機車組</h2>

      {motorcycle.length === 0 && <p>目前沒有成績</p>}

      {motorcycle.map((row, index) => (
        <div
          key={row.id}
          style={{
            border: "1px solid #444",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <h3>#{index + 1}</h3>
          <p>暱稱：{row.nickname}</p>
          <p>車款：{row.vehicle_model}</p>
          <p>成績：{formatTime(row.time_ms)}</p>
          <p>平均速度：{Number(row.avg_speed).toFixed(1)} km/h</p>
        </div>
      ))}

      <hr />

      <h2>🚗 汽車組</h2>

      {car.length === 0 && <p>目前沒有成績</p>}

      {car.map((row, index) => (
        <div
          key={row.id}
          style={{
            border: "1px solid #444",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <h3>#{index + 1}</h3>
          <p>暱稱：{row.nickname}</p>
          <p>車款：{row.vehicle_model}</p>
          <p>成績：{formatTime(row.time_ms)}</p>
          <p>平均速度：{Number(row.avg_speed).toFixed(1)} km/h</p>
        </div>
      ))}
    </div>
  );
}