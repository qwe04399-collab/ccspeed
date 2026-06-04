export default function LeaderboardResults({
  track,
  direction,
  vehicleGroup,
  onBack,
}) {
  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h1>🏁 成績排行榜</h1>

      <h2>{track?.name}</h2>
      <p>方向：{direction}</p>
      <p>組別：{vehicleGroup}</p>

      <button
        onClick={onBack}
        style={{ width: "100%", padding: 12, marginBottom: 20 }}
      >
        返回組別選擇
      </button>
    </div>
  );
}