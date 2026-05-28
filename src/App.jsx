import { useEffect, useRef, useState } from "react";
import MapView from "./MapView";

export default function App() {
  const [status, setStatus] = useState("等待啟動");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [speed, setSpeed] = useState(0);

  const watchRef = useRef(null);

  // 🟢 啟動 GPS
  const startGPS = () => {
    if (watchRef.current) return;

    setStatus("GPS監測中");

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setSpeed(pos.coords.speed || 0);
      },
      (err) => {
        console.log(err);
        setStatus("GPS錯誤");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );
  };

  // 🧹 清除 GPS
  useEffect(() => {
    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "Arial" }}>
      <h1>🏁 CCSPEED</h1>

      <button
        onClick={startGPS}
        style={{
          padding: "10px 16px",
          fontSize: 16,
          marginBottom: 10,
        }}
      >
        啟動 GPS
      </button>

      <h3>{status}</h3>

      <div style={{ marginBottom: 10 }}>
        <p>📍 緯度：{lat.toFixed(6)}</p>
        <p>📍 經度：{lng.toFixed(6)}</p>
        <p>🚗 速度：{(speed * 3.6).toFixed(1)} km/h</p>
      </div>

      <hr />

      {/* 🗺 地圖 */}
      <MapView />
    </div>
  );
}