import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const STORAGE_KEY = "redirects-v1";

async function loadHistory(): Promise<Record<string, number>> {
  try {
    const result = await window.storage.get(STORAGE_KEY);
    return result ? JSON.parse(result.value) : {};
  } catch {
    return {};
  }
}

async function saveHistory(history: Record<string, number>) {
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error(e);
  }
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getWeekKeys() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function formatDateLong(key: string) {
  return new Date(key + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function RedirectsCounter() {
  const [history, setHistory] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [flash, setFlash] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory().then((h) => { setHistory(h); setLoaded(true); });
  }, []);

  const todayKey = getTodayKey();
  const todayCount = history[todayKey] || 0;
  const weekKeys = getWeekKeys();
  const maxWeek = Math.max(...weekKeys.map((k) => history[k] || 0), 1);
  const totalAll = Object.values(history).reduce((a, b) => a + b, 0);

  const handleClick = useCallback(async () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 120);
    const updated = { ...history, [todayKey]: (history[todayKey] || 0) + 1 };
    setHistory(updated);
    await saveHistory(updated);
  }, [history, todayKey]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <span className="text-zinc-600 text-xs tracking-widest uppercase font-mono">loading</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden"
      style={{
        fontFamily: "'Courier New', Courier, monospace",
        minHeight: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* THE BUTTON */}
      <button
        onClick={handleClick}
        className="flex-1 flex flex-col items-center justify-center w-full relative cursor-pointer border-0 outline-none"
        style={{
          background: flash ? "#27272a" : "#18181b",
          transition: "background 0.08s ease, transform 0.08s ease",
          transform: flash ? "scale(0.992)" : "scale(1)",
          borderBottom: "1px solid #27272a",
        }}
      >
        <div
          className="tabular-nums font-black leading-none text-zinc-50"
          style={{
            fontSize: "clamp(5rem, 22vw, 16rem)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {todayCount}
        </div>
        <div
          className="mt-5 text-zinc-500 uppercase"
          style={{ fontSize: "0.65rem", letterSpacing: "0.35em" }}
        >
          tap to count
        </div>

        {/* corner label */}
        <div
          className="absolute top-4 left-5 text-zinc-700 uppercase"
          style={{ fontSize: "0.6rem", letterSpacing: "0.25em" }}
        >
          today
        </div>
      </button>

      {/* WEEK HISTORY */}
      <div className="px-5 pt-4 pb-2" style={{ borderBottom: "1px solid #27272a" }}>
        <div
          className="text-zinc-600 uppercase mb-3"
          style={{ fontSize: "0.6rem", letterSpacing: "0.3em" }}
        >
          past 7 days
        </div>
        <div className="flex items-end gap-[6px] h-10">
          {weekKeys.map((key) => {
            const count = history[key] || 0;
            const isToday = key === todayKey;
            const pct = (count / maxWeek) * 100;
            const dayLabel = new Date(key + "T12:00:00")
              .toLocaleDateString("en-US", { weekday: "short" })
              .charAt(0);
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-[3px]">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: "28px" }}>
                  <div
                    style={{
                      width: "100%",
                      height: count === 0 ? "2px" : `${Math.max(pct, 10)}%`,
                      background: isToday ? "#e4e4e7" : "#3f3f46",
                      borderRadius: "2px",
                      transition: "height 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "0.55rem",
                    color: isToday ? "#a1a1aa" : "#52525b",
                    letterSpacing: "0.1em",
                  }}
                >
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
        {/* counts row */}
        <div className="flex gap-[6px] mt-[2px]">
          {weekKeys.map((key) => {
            const count = history[key] || 0;
            const isToday = key === todayKey;
            return (
              <div key={key} className="flex-1 text-center">
                <span
                  style={{
                    fontSize: "0.55rem",
                    color: isToday ? "#71717a" : "#3f3f46",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count > 0 ? count : "·"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div
        className="px-5 pt-3 flex items-center justify-between"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        <span
          className="text-zinc-700 tabular-nums"
          style={{ fontSize: "0.6rem", letterSpacing: "0.15em" }}
        >
          {totalAll} total
        </span>

        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <button
              className="text-zinc-500 hover:text-zinc-200 transition-colors uppercase"
              style={{ fontSize: "0.6rem", letterSpacing: "0.25em", background: "none", border: "none", cursor: "pointer" }}
            >
              full history →
            </button>
          </DialogTrigger>
          <DialogContent
            className="border-zinc-800 max-w-xs"
            style={{ background: "#18181b", color: "#e4e4e7", fontFamily: "'Courier New', Courier, monospace" }}
          >
            <DialogHeader>
              <DialogTitle
                style={{ fontSize: "0.65rem", letterSpacing: "0.3em", color: "#71717a", textTransform: "uppercase" }}
              >
                full history
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-72 mt-1 pr-2">
              {Object.keys(history).length === 0 ? (
                <p style={{ color: "#52525b", fontSize: "0.75rem" }}>no history yet.</p>
              ) : (
                <div>
                  {Object.entries(history)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([key, count]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-[10px]"
                        style={{ borderBottom: "1px solid #27272a" }}
                      >
                        <span style={{ fontSize: "0.7rem", color: "#71717a" }}>
                          {formatDateLong(key)}
                        </span>
                        <span
                          className="tabular-nums font-black"
                          style={{ fontSize: "1rem", color: "#f4f4f5" }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
