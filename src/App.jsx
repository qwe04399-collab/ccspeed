import { useState } from "react";
import RacePage from "./RacePage";
import Leaderboard from "./Leaderboard";

export default function App() {
  const [page, setPage] = useState("home");

  const [nickname, setNickname] = useState("");
  const [vehicleType, setVehicleType] = useState("機車");
  const [vehicleModel, setVehicleModel] = useState("");

  if (page === "race") {
    return (
      <RacePage
        nickname={nickname}
        vehicleType={vehicleType}
        vehicleModel={vehicleModel}
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
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 14 }}
      >
        <option value="機車">機車</option>
        <option value="汽車">汽車</option>
      </select>

      <input
        placeholder="輸入車款"
        value={vehicleModel}
        onChange={(e) => setVehicleModel(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      />

      <button
        onClick={() => {
          if (!nickname || !vehicleModel) {
            alert("請輸入暱稱與車款");
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