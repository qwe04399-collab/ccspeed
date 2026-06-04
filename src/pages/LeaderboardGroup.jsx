export default function LeaderboardGroup({
  track,
  direction,
  onBack,
}) {
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        padding: 20,
      }}
    >
      <h1>🏆 排行榜</h1>

      <h2>{track?.name}</h2>

      <p>方向：{direction}</p>

      <button
        onClick={onBack}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
        }}
      >
        返回方向選擇
      </button>

      <button
        style={{
          width: "100%",
          padding: 16,
          marginBottom: 12,
          fontSize: 18,
        }}
      >
        🛵 速克達組
      </button>

      <button
        style={{
          width: "100%",
          padding: 16,
          marginBottom: 12,
          fontSize: 18,
        }}
      >
        🏍 檔車組
      </button>

      <button
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
        }}
      >
        🚗 汽車組
      </button>
    </div>
  );
}