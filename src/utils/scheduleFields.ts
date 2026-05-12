export const STRUCTURED_LOCATION_SEPARATOR = " | ";

export const pad2 = (value: string | number) => String(value).padStart(2, "0");

export const parseStructuredLocation = (value?: string | null) => {
  const [name = "", ...addressParts] = (value ?? "").split("|");
  return {
    name: name.trim(),
    address: addressParts.join("|").trim(),
  };
};

export const composeStructuredLocation = (name: string, address: string) =>
  [name.trim(), address.trim()].filter(Boolean).join(STRUCTURED_LOCATION_SEPARATOR);

export const formatStructuredLocation = (value?: string | null, fallback = "장소 미정") => {
  const { name, address } = parseStructuredLocation(value);
  const display = [name, address].filter(Boolean).join(", ");
  return display || fallback;
};

export const getDaysInMonth = (year: string, month: string) => {
  const y = Number(year);
  const m = Number(month);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
};

export const getYearOptions = (startYear = new Date().getFullYear(), count = 4) =>
  Array.from({ length: count }, (_, i) => String(startYear + i));

export const getMonthOptions = () =>
  Array.from({ length: 12 }, (_, i) => pad2(i + 1));

export const getDayOptions = (year: string, month: string) =>
  Array.from({ length: getDaysInMonth(year, month) }, (_, i) => pad2(i + 1));

export const getHourOptions = () =>
  Array.from({ length: 24 }, (_, i) => pad2(i));

export const getTenMinuteOptions = () =>
  [0, 10, 20, 30, 40, 50].map(pad2);

export const composeIsoDate = (year: string, month: string, day: string) =>
  year && month && day ? `${year}-${month}-${day}` : "";

export const composeTime = (hour: string, minute: string) =>
  hour ? `${hour}:${minute || "00"}` : "";

export const parseTimeParts = (value?: string | null) => {
  const [hour = "", minute = ""] = (value ?? "").split(":");
  return {
    hour,
    minute: minute || "00",
  };
};
