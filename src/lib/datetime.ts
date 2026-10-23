// The API returns UTC timestamps without a zone suffix; treat them as UTC.
export function parseApiDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "14:30  05/01/2024" in the viewer's local time, matching the dashboard tables. */
export function formatDateTime(value?: string | null) {
  const date = parseApiDate(value);
  if (!date) return "—";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}  ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatTimeAndDate(value?: string | null) {
  const date = parseApiDate(value);
  if (!date) return { time: "—", date: "—" };
  return {
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
  };
}

export function formatDate(value?: string | null) {
  return formatTimeAndDate(value).date;
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
