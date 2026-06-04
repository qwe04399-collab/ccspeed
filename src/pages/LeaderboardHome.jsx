export default function LeaderboardHome({
  tracks,
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

      <button
        onClick={onBack}
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 20,
        }}
      >
        返回首頁
      </button>

      <h2>選擇賽道</h2>

      {tracks.length === 0 && (
        <p>目前沒有可用賽道</p>
      )}

      {tracks.map((track) => (
        <button
          key={track.id}
          style={{
            width: "100%",
            padding: 16,
            marginBottom: 12,
            fontSize: 18,
          }}
        >
          🏁 {track.name}
        </button>
      ))}
    </div>
  );
}