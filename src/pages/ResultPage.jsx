import { useMemo, useState } from "react";
import { supabase } from "../supabase";

function formatTime(ms) {
  const safeMs = Number(ms || 0);
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const centiseconds = Math.floor((safeMs % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeContact(value) {
  return normalizeText(value).toLowerCase();
}

export default function ResultPage({ result, onBackHome, onRaceAgain }) {
  const [contact, setContact] = useState("");
  const [nickname, setNickname] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [player, setPlayer] = useState(null);
  const [step, setStep] = useState("contact");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const directionLabel = useMemo(() => {
    if (!result) return "";
    return result.direction || "";
  }, [result]);

  if (!result) {
    return (
      <div style={{ maxWidth: 420, margin: "40px auto", padding: 20 }}>
        <h1>沒有成績資料</h1>
        <button onClick={onBackHome} style={{ width: "100%", padding: 14 }}>
          返回首頁
        </button>
      </div>
    );
  }

  async function checkContact() {
    const cleanContact = normalizeContact(contact);
    setMessage("");

    if (!cleanContact) {
      setMessage("請輸入 Mail 或手機號碼");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("contact", cleanContact)
      .maybeSingle();

    setSubmitting(false);

    if (error) {
      console.error("玩家查詢失敗", error);
      setMessage("玩家查詢失敗：" + error.message);
      return;
    }

    if (data) {
      setPlayer(data);
      setNickname(data.nickname || "");
      setStep("knownPlayer");
      return;
    }

    setPlayer(null);
    setStep("newPlayer");
  }

  async function saveResult() {
    if (saved) return;

    const cleanContact = normalizeContact(contact);
    const cleanNickname = normalizeText(nickname);
    const cleanVehicleModel = normalizeText(vehicleModel);

    setMessage("");

    if (!cleanContact) {
      setMessage("請輸入 Mail 或手機號碼");
      setStep("contact");
      return;
    }

    if (!cleanNickname) {
      setMessage("請輸入暱稱");
      return;
    }

    if (!cleanVehicleModel) {
      setMessage("請輸入本次車款");
      return;
    }

    setSubmitting(true);

    let currentPlayer = player;

    if (!currentPlayer) {
      const { data: duplicatedNickname, error: nicknameError } = await supabase
        .from("players")
        .select("id")
        .eq("nickname", cleanNickname)
        .maybeSingle();

      if (nicknameError) {
        console.error("暱稱檢查失敗", nicknameError);
        setSubmitting(false);
        setMessage("暱稱檢查失敗：" + nicknameError.message);
        return;
      }

      if (duplicatedNickname) {
        setSubmitting(false);
        setMessage("⚠️ 這個暱稱已經有人使用了，請換一個新的暱稱");
        return;
      }

      const { data: createdPlayer, error: createPlayerError } = await supabase
        .from("players")
        .insert([
          {
            contact: cleanContact,
            nickname: cleanNickname,
          },
        ])
        .select("*")
        .single();

      if (createPlayerError) {
        console.error("玩家建立失敗", createPlayerError);
        setSubmitting(false);
        setMessage("玩家建立失敗：" + createPlayerError.message);
        return;
      }

      currentPlayer = createdPlayer;
      setPlayer(createdPlayer);
    }

    const { error: saveError } = await supabase.from("runs").insert([
      {
        player_id: currentPlayer.id,
        contact: cleanContact,
        nickname: currentPlayer.nickname,

        track_id: result.track.id,
        track_name: result.track.name,
        start_name: result.track.start_name,
        finish_name: result.track.finish_name,

        direction: result.direction,
        vehicle_type: result.vehicleType,
        vehicle_model: cleanVehicleModel,

        elapsed_ms: result.elapsedMs,
        avg_speed: result.avgSpeed,
        max_speed: result.maxSpeed,
        start_time: result.startTime,
        end_time: result.endTime,
      },
    ]);

    setSubmitting(false);

    if (saveError) {
      console.error("成績寫入失敗", saveError);
      setMessage("成績寫入失敗：" + saveError.message);
      return;
    }

    setSaved(true);
    setMessage("🏆 成績已送出");
  }

  return (
    <div style={{ maxWidth: 420, margin: "30px auto", padding: 20 }}>
      <h1>🏆 完成計時</h1>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: 18,
          marginBottom: 20,
        }}
      >
        <p style={{ margin: 0, color: "#666" }}>{result.track?.name}</p>
        <h1 style={{ margin: "8px 0", fontSize: 44 }}>
          {formatTime(result.elapsedMs)}
        </h1>
        <p>方向：{directionLabel}</p>
        <p>組別：{result.vehicleType}</p>
        <p>平均速度：{Number(result.avgSpeed || 0).toFixed(1)} km/h</p>
        <p>最高速度：{Number(result.maxSpeed || 0).toFixed(1)} km/h</p>
      </div>

      {step === "contact" && !saved && (
        <>
          <label>Mail / 手機</label>
          <input
            placeholder="輸入 Mail 或手機號碼"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 14 }}
          />

          <button
            onClick={checkContact}
            disabled={submitting}
            style={{ width: "100%", padding: 14, fontSize: 18 }}
          >
            {submitting ? "查詢中..." : "下一步"}
          </button>
        </>
      )}

      {step === "knownPlayer" && !saved && (
        <>
          <h3>歡迎回來，{nickname}</h3>
          <p style={{ color: "#666" }}>
            系統已用你的 Mail / 手機找到既有暱稱，不需要重新設定。
          </p>

          <label>本次車款</label>
          <input
            placeholder="例如：JET SL+ / R15 / GR86"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 14 }}
          />

          <button
            onClick={saveResult}
            disabled={submitting}
            style={{ width: "100%", padding: 14, fontSize: 18 }}
          >
            {submitting ? "送出中..." : "送出成績"}
          </button>
        </>
      )}

      {step === "newPlayer" && !saved && (
        <>
          <p style={{ color: "#666" }}>第一次使用，請設定你的排行榜暱稱。</p>

          <label>暱稱</label>
          <input
            placeholder="輸入暱稱"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 14 }}
          />

          <label>本次車款</label>
          <input
            placeholder="例如：JET SL+ / R15 / GR86"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            style={{ width: "100%", padding: 12, marginBottom: 14 }}
          />

          <button
            onClick={saveResult}
            disabled={submitting}
            style={{ width: "100%", padding: 14, fontSize: 18 }}
          >
            {submitting ? "送出中..." : "送出成績"}
          </button>
        </>
      )}

      {message && (
        <p style={{ marginTop: 14, color: message.includes("⚠️") ? "#b45309" : "#333" }}>
          {message}
        </p>
      )}

      {saved && (
        <div style={{ marginTop: 20 }}>
          <button onClick={onBackHome} style={{ width: "100%", padding: 14 }}>
            返回首頁
          </button>
        </div>
      )}

      {!saved && (
        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button onClick={onRaceAgain} style={{ flex: 1, padding: 12 }}>
            重新挑戰
          </button>
          <button onClick={onBackHome} style={{ flex: 1, padding: 12 }}>
            回首頁
          </button>
        </div>
      )}
    </div>
  );
}
