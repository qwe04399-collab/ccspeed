import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// =========================
// 🧠 OSRM Snap
// =========================
async function snap(lat, lng) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`
    );
    const data = await res.json();

    const loc = data.waypoints?.[0]?.location;
    if (!loc) return [lat, lng];

    return [loc[1], loc[0]];
  } catch {
    return [lat, lng];
  }
}

// =========================
// 🧠 distance
// =========================
function dist(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy) * 111000;
}

// =========================
// 🧠 sector 定義（3段）
// =========================
const sectorLines = [
  {
    name: "S1",
    start: [22.843293, 120.247413],
    end: [22.836, 120.255],
  },
  {
    name: "S2",
    start: [22.836, 120.255],
    end: [22.830, 120.265],
  },
  {
    name: "S3",
    start: [22.830, 120.265],
    end: [22.825971, 120.272488],
  },
];

// =========================
// 🏁 MAIN
// =========================
export default function MapView() {
  const [path, setPath] = useState([]);
  const [replayIndex, setReplayIndex] = useState(0);

  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const [laps, setLaps] = useState([]);
  const [sectorTimes, setSectorTimes] = useState({});

  const watchRef = useRef(null);

  // =========================
  // 🟢 replay
  // =========================
  useEffect(() => {
    if (path.length === 0) return;

    const t = setInterval(() => {
      setReplayIndex((i) => (i < path.length - 1 ? i + 1 : i));
    }, 80);

    return () => clearInterval(t);
  }, [path]);

  // =========================
  // 🧠 sector 判斷
  // =========================
  function checkSector(p, sector) {
    return dist(p, sector.start) < 20;
  }

  useEffect(() => {
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const raw = [pos.coords.latitude, pos.coords.longitude];

        const fixed = await snap(raw[0], raw[1]);

        setPath((prev) => {
          const last = prev[prev.length - 1];

          if (last && dist(last, fixed) > 80) return prev;

          // ======================
          // 🏁 start lap
          // ======================
          if (!running && dist(fixed, sectorLines[0].start) < 15) {
            setRunning(true);
            setStartTime(Date.now());
            setSectorTimes({});
          }

          // ======================
          // 🏁 sector timing
          // ======================
          if (running) {
            sectorLines.forEach((s, i) => {
              if (checkSector(fixed, s)) {
                setSectorTimes((prev) => {
                  if (prev[s.name]) return prev;

                  return {
                    ...prev,
                    [s.name]: (Date.now() - startTime) / 1000,
                  };
                });
              }
            });
          }

          // ======================
          // 🏁 finish lap
          // ======================
          if (
            running &&
            dist(fixed, sectorLines[2].end) < 15
          ) {
            const lapTime = (Date.now() - startTime) / 1000;

            setLaps((prev) => [...prev, lapTime]);
            setRunning(false);
          }

          return [...prev, fixed];
        });
      },
      (err) => console.log(err),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      if (watchRef.current) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, [running, startTime]);

  return (
    <div>
      {/* ================= UI ================= */}
      <div style={{ padding: 10 }}>
        <h2>🏁 CCSPEED v16 RACING</h2>

        {running && (
          <h3>
            ⏱ Lap Time:
            {((Date.now() - startTime) / 1000).toFixed(2)}s
          </h3>
        )}

        <h3>🏁 LAPS</h3>
        {laps.map((t, i) => (
          <div key={i}>Lap {i + 1}: {t.toFixed(2)}s</div>
        ))}

        <h3>📊 SECTORS</h3>
        {Object.entries(sectorTimes).map(([k, v]) => (
          <div key={k}>{k}: {v.toFixed(2)}s</div>
        ))}
      </div>

      {/* ================= MAP ================= */}
      <MapContainer
        center={[22.835, 120.26]}
        zoom={14}
        style={{ height: "500px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* sector lines */}
        {sectorLines.map((s, i) => (
          <Polyline
            key={i}
            positions={[s.start, s.end]}
            color="yellow"
          />
        ))}

        {/* path */}
        <Polyline positions={path} color="blue" />

        {/* replay car */}
        {path.length > 0 && (
          <Marker position={path[replayIndex]}>
            <Popup>REPLAY</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}