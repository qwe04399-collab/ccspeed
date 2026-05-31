import { useState } from "react";
import RacePage from "./RacePage";

export default function App() {
  const [started, setStarted] = useState(false);

  const [nickname, setNickname] = useState("");
  const [vehicleType, setVehicleType] = useState("機車");
  const [vehicleModel, setVehicleModel] = useState("");

  if (started) {
    return (
      <RacePage
        nickname={nickname}
        vehicleType={vehicleType}
        vehicleModel={vehicleModel}
      />
    );
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "50px auto",
        padding: 20,
        textAlign: "center",
      }}
    >
      <h1>🏁 CCSPEED</h1>

      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="輸入暱稱"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
          }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
          }}
        >
          <option value="機車">機車</option>
          <option value="汽車">汽車</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="輸入車款"
          value={vehicleModel}
          onChange={(e) => setVehicleModel(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
          }}
        />
      </div>

      <button
        onClick={() => {
          if (!nickname) {
            alert("請輸入暱稱");
            return;
          }

          if (!vehicleModel) {
            alert("請輸入車款");
            return;
          }

          setStarted(true);
        }}
        style={{
          padding: "12px 24px",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        開始挑戰
      </button>
    </div>
  );
}