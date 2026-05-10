export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/10"
      style={{
        backgroundColor: 'rgb(13, 13, 26)',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors mr-1"
          aria-label="Открыть меню"
        >
          ☰
        </button>
        <span className="text-blue-400 text-lg">✦</span>
        <span className="font-semibold text-white text-base tracking-wide">
          Mission Control
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Поиск"
        >
          🔍
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
          <span className="text-sm text-green-400">Online</span>
        </div>
      </div>
    </header>
  );
}
