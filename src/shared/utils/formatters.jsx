const NTG = window.NTG = window.NTG || {};
NTG.shared = NTG.shared || {};
NTG.shared.utils = NTG.shared.utils || {};

function fmtTime(ts) {
  const date = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return date.toLocaleTimeString("en-DK", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDate(ts) {
  const date = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return date.toLocaleDateString("en-DK", { day: "2-digit", month: "short" });
}

function fmtDelta(ts, now) {
  const ms = ts - now;
  const sign = ms >= 0 ? "+" : "-";
  const minutes = Math.abs(Math.round(ms / 60000));
  if (minutes < 60) return `${sign}${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${sign}${hours}h ${remainder.toString().padStart(2, "0")}m`;
}

function statusLabel(status) {
  return ({
    "in-transit": "In transit",
    "delivered": "Delivered",
    "at-risk": "At risk",
    "exception": "Exception",
    "scheduled": "Scheduled",
  })[status];
}

function statusDot(status, accent) {
  const colors = {
    "in-transit": accent,
    "delivered": "#53cd98",
    "at-risk": "#f1a45c",
    "exception": "#ff7d74",
    "scheduled": "#94a3b8",
  };
  return colors[status] || accent;
}

NTG.shared.utils.formatters = {
  fmtTime,
  fmtDate,
  fmtDelta,
  statusLabel,
  statusDot,
};
