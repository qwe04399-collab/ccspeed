import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function AdminPage() {
  const [tracks, setTracks] = useState([]);
  const [name, setName] = useState("");

  async function loadTracks() {
    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("讀取賽道失敗：" + error.message);
      return;
    }

    setTracks(
      (data || []).map((track) => ({
        ...track,

        startLeftText:
          track.start_left_lat != null && track.start_left_lng != null
            ? `${track.start_left_lat},${track.start_left_lng}`
            : "",

        startRightText:
          track.start_right_lat != null && track.start_right_lng != null
            ? `${track.start_right_lat},${track.start_right_lng}`
            : "",

        finishLeftText:
          track.finish_left_lat != null && track.finish_left_lng != null
            ? `${track.finish_left_lat},${track.finish_left_lng}`
            : "",

        finishRightText:
          track.finish_right_lat != null && track.finish_right_lng != null
            ? `${track.finish_right_lat},${track.finish_right_lng}`
            : "",
      }))
    );
  }

  async function addTrack() {
    if (!name.trim()) {
      alert("請輸入賽道名稱");
      return;
    }

    const { error } = await supabase.from("tracks").insert([
      {
        name: name.trim(),
        is_active: true,
      },
    ]);

    if (error) {
      alert("新增賽道失敗：" + error.message);
      return;
    }

    setName("");
    loadTracks();
  }

  async function updateTrack(track) {
    const startLeft = parseCoordinate(track.startLeftText);
    const startRight = parseCoordinate(track.startRightText);
    const finishLeft = parseCoordinate(track.finishLeftText);
    const finishRight = parseCoordinate(track.finishRightText);

    const { error } = await supabase
      .from("tracks")
      .update({
        name: track.name,

        start_name: track.start_name,
        finish_name: track.finish_name,

        start_left_lat: startLeft.lat,
        start_left_lng: startLeft.lng,
        start_right_lat: startRight.lat,
        start_right_lng: startRight.lng,

        finish_left_lat: finishLeft.lat,
        finish_left_lng: finishLeft.lng,
        finish_right_lat: finishRight.lat,
        finish_right_lng: finishRight.lng,

        is_active: track.is_active,
      })
      .eq("id", track.id);

    if (error) {
      alert("更新失敗：" + error.message);
      return;
    }

    alert("賽道已更新");
    loadTracks();
  }

  function updateLocalTrack(id, field, value) {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === id
          ? {
              ...track,
              [field]: value,
            }
          : track
      )
    );
  }

  function parseCoordinate(text) {
    if (!text) {
      return {
        lat: null,
        lng: null,
      };
    }

    const cleaned = text.trim().replace(/\s+/g, "");
    const parts = cleaned.split(",");

    if (parts.length !== 2) {
      return {
        lat: null,
        lng: null,
      };
    }

    const lat = Number(parts[0]);
    const lng = Number(parts[1]);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return {
        lat: null,
        lng: null,
      };
    }

    return {
      lat,
      lng,
    };
  }

  function renderInput(track, field, label) {
    return (
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
          {label}
        </label>
        <input
          placeholder="例如：22.843293,120.247413"
          value={track[field] ?? ""}
          onChange={(e) => updateLocalTrack(track.id, field, e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>
    );
  }

  useEffect(() => {
    loadTracks();
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 20 }}>
      <h1>CCSPEED 管理者後台</h1>

      <h2>新增賽道</h2>

      <input
        placeholder="例如：楠西 ↔ 大埔"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 10 }}
      />

      <button onClick={addTrack} style={{ width: "100%", padding: 12 }}>
        新增賽道
      </button>

      <hr />

      <h2>賽道列表</h2>

      {tracks.map((track) => (
        <div
          key={track.id}
          style={{
            border: "1px solid #444",
            borderRadius: 8,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <h3>{track.name}</h3>

          <p style={{ fontSize: 12, color: "#999" }}>ID：{track.id}</p>

          {renderInput(track, "name", "賽道名稱")}
          
          {renderInput(track, "start_name", "起點名稱")}
          {renderInput(track, "finish_name", "終點名稱")}

          <h4>🔴 起點線</h4>

          {renderInput(track, "startLeftText", "起點左")}
          {renderInput(track, "startRightText", "起點右")}

          <h4>🟢 終點線</h4>

          {renderInput(track, "finishLeftText", "終點左")}
          {renderInput(track, "finishRightText", "終點右")}

          <label style={{ display: "block", marginTop: 12 }}>
            <input
              type="checkbox"
              checked={track.is_active}
              onChange={(e) =>
                updateLocalTrack(track.id, "is_active", e.target.checked)
              }
            />
            啟用賽道
          </label>

          <button
            onClick={() => updateTrack(track)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 12,
              fontWeight: "bold",
            }}
          >
            儲存賽道設定
          </button>
        </div>
      ))}
    </div>
  );
}