import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import data from "@/data/daftar.json";

interface FavoriteItem {
  id: number;
  name: string;
  picture: string;
  generation: string;
  graduated: string;
  trainee: string;
}

const GRID_SIZE = 9;

const GRADIENTS = [
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
  "from-cyan-500 to-teal-600",
  "from-red-500 to-rose-600",
];

const FavoritePicker = () => {
  const [cells, setCells] = useState<(FavoriteItem | null)[]>(Array(GRID_SIZE).fill(null));
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewOnly, setViewOnly] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const filledCount = cells.filter(Boolean).length;
  const allFilled = filledCount === GRID_SIZE;

  // Load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const picks = params.get("picks");
    if (picks) {
      const ids = picks.split(",").map(Number);
      if (ids.length === GRID_SIZE) {
        const items = ids.map((id) => data.categories.find((c) => c.id === id) || null);
        if (items.every(Boolean)) {
          setCells(items);
          setViewOnly(true);
        }
      }
    }
  }, []);

  const handleCellClick = (index: number) => {
    if (viewOnly) return;
    setActiveCell(index);
    setSearchQuery("");
  };

  const handlePickItem = (item: FavoriteItem) => {
    if (activeCell === null) return;
    // Prevent duplicates
    if (cells.some((c) => c?.id === item.id)) return;
    const newCells = [...cells];
    newCells[activeCell] = item;
    setCells(newCells);
    setActiveCell(null);
  };

  const handleClearCell = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewOnly) return;
    const newCells = [...cells];
    newCells[index] = null;
    setCells(newCells);
  };

  const handleShare = async () => {
    const ids = cells.map((c) => c?.id).join(",");
    const url = `${window.location.origin}?picks=${ids}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "9 OShi Favorit", url });
        return;
      } catch { /* fallback */ }
    }
    await navigator.clipboard.writeText(url);
    alert("Link disalin ke clipboard!");
  };

  const handleDownload = async () => {
    if (!gridRef.current) return;
    try {
      const dataUrl = await toPng(gridRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "my-9-favorites.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setCells(Array(GRID_SIZE).fill(null));
    setActiveCell(null);
    setViewOnly(false);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const usedIds = new Set(cells.filter(Boolean).map((c) => c!.id));
  const filteredCategories = data.categories.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-6 px-4 font-body">
      <h1 className="font-display text-3xl sm:text-5xl text-center text-foreground mb-1">
       My 9 Oshi of All Time
      </h1>
      <p className="text-center text-muted-foreground mb-6 text-sm sm:text-base">
        oshi favorit sepanjang masa
      </p>

      {/* 3x3 Grid */}
      <div ref={gridRef} className="bg-card p-3 sm:p-4 rounded-2xl shadow-xl mb-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {cells.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              className={`relative w-[110px] h-[135px] sm:w-[140px] sm:h-[180px] rounded-xl overflow-hidden transition-all duration-200 ${
                activeCell === i
                  ? "ring-3 ring-primary ring-offset-2 ring-offset-card"
                  : ""
              } ${
                cell
                  ? ""
                  : "border-2 border-dashed border-border hover:border-primary/50 hover:bg-grid-item-hover"
              }`}
            >
              {cell ? (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i]} flex items-center justify-center`}>
                    <img src={cell.picture} className="w-full h-full rounded-l object-cover" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                    <span className="text-[11px] sm:text-sm font-semibold text-primary-foreground leading-tight block text-center">
                      {cell.name.replace(/^.\s/, "")}
                    </span>
                  </div>
                  {!viewOnly && (
                    <button
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-transparent text-primary-foreground text-xs flex items-center justify-center"
                    >
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-2xl text-muted-foreground/40">+</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      {allFilled && (
        <div className="flex flex-wrap gap-3 justify-center mb-6 animate-pop-in">
          <button onClick={handleReset} className="px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold shadow-lg hover:opacity-95 transition-opacity text-l">
            🔄 Reset
          </button>
        </div>
      )}

      {/* Picker modal */}
      {activeCell !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={() => setActiveCell(null)}>
          <div
            className="bg-card w-full max-w-md max-h-[70vh] rounded-t-2xl sm:rounded-2xl p-5 overflow-y-auto shadow-2xl animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-foreground">Pilih Favorit</h3>
              <button onClick={() => setActiveCell(null)} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari favorit..."
              className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground mb-3"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              {filteredCategories.map((item) => {
                const used = usedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !used && handlePickItem(item)}
                    disabled={used}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      used
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-secondary active:scale-[0.98]"
                    }`}
                  >
                    <img src={item.picture} className="w-15 h-20 rounded-l object-cover" />
                    <span className="text-sm font-medium text-foreground">
                      {item.name.replace(/^.\s/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!allFilled && !viewOnly && (
        <p className="text-muted-foreground text-sm">{filledCount}/{GRID_SIZE} dipilih</p>
      )}
    </div>
  );
};

export default FavoritePicker;
