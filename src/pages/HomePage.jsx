export default function HomePage({ onStartRace, onLeaderboard }) {
  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 20 }}>
      <h1>🏁 CCSPEED</h1>
      <p style={{ marginBottom: 30 }}>最速公路</p>

      <button
        onClick={onStartRace}
        style={{ width: "100%", padding: 16, fontSize: 18, marginBottom: 12 }}
      >
        開始計時
      </button>

      <button
        onClick={onLeaderboard}
        style={{ width: "100%", padding: 16, fontSize: 18 }}
      >
        排行榜
      </button>
    </div>
  );
}