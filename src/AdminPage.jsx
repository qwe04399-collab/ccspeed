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

    setTracks(data || []);
  }

  async function addTrack() {
    if (!name) {
      alert("請輸入賽道名稱");
      return;
    }

    const { error } = await supabase.from("tracks").insert([
      {
        name,
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

  useEffect(() => {
    loadTracks();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
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
            padding: 12,
            marginBottom: 12,
          }}
        >
          <h3>{track.name}</h3>
          <p>ID：{track.id}</p>
          <p>啟用：{track.is_active ? "是" : "否"}</p>
          <button
            onClick={async () => {
                const { error } = await supabase
                    .from("tracks")
                    .update({
                    is_active: !track.is_active,
            })
            .eq("id", track.id);

            if (error) {
            alert(error.message);
            return;
            }

            loadTracks();
            }}
            style={{
            marginTop: 10,
            padding: "8px 12px",
            }}
            >
            {track.is_active ? "停用賽道" : "啟用賽道"}
            </button>
        </div>
      ))}
    </div>
  );
}