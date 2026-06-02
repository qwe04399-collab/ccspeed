import { useEffect, useState } from "react";
import RacePage from "./RacePage";
import Leaderboard from "./Leaderboard";
import { supabase } from "./supabase";

export default function App() {
  const [page, setPage] = useState("home");

  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const [nickname, setNickname] = useState("");
  const [vehicleType, setVehicleType] = useState("速克達");
  const [vehicleModel, setVehicleModel] = useState("");

  useEffect(() => {
    async function loadTracks() {
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("賽道讀取失敗", error);
        alert("賽道讀取失敗：" + error.message);
        return;
      }

      setTracks(data || []);

      if (data && data.length > 0) {
        setSelectedTrack(data[0]);
      }
    }

    loadTracks();
  }, []);

  if (page === "race") {
    return (
      <RacePage
        nickname={nickname}
        vehicleType={vehicleType}
        vehicleModel={vehicleModel}
        track={selectedTrack}
      />
    );
  }

  if (page === "leaderboard") {
    return <Leaderboard />;
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h1>🏁 CCSPEED</h1>

      <input
        placeholder="輸入暱稱"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      />

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

      <select
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      >
        <option value="速克達">速克達</option>
        <option value="檔車">檔車</option>
        <option value="汽車">汽車</option>
      </select>

      <input
        placeholder="輸入本次車款，例如：JET SL+ / R15 / GR86"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 10 }}
      />

      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        請輸入本次實際使用車款，車款會顯示於排行榜。
      </p>

      <button
        onClick={() => {
          if (!nickname || !vehicleModel) {
            alert("請輸入暱稱與車款");
            return;
          }

          if (!selectedTrack) {
            alert("請選擇賽道");
            return;
          }

          setPage("race");
        }}
        style={{ width: "100%", padding: 14, fontSize: 18 }}
      >
        開始挑戰
      </button>

      <button
        onClick={() => setPage("leaderboard")}
        style={{ width: "100%", padding: 14, fontSize: 18, marginTop: 12 }}
      >
        查看排行榜
      </button>
    </div>
  );
}