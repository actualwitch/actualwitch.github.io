import { Duration, DurationLikeObject } from "luxon";

export const getDurationFromHuman = (human: string) => {
  let mode: null | "every" = null;
  const duration: DurationLikeObject = {};
  let amount: null | number = null;
  const words = human.split(" ");
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (i === 0) {
      if (word === "every") mode = "every";
    } else {
      if (mode === "every") {
        if (amount) {
          const unit = word;
          switch (unit) {
            case "second":
            case "seconds":
              duration.seconds = amount;
              break;
            case "minute":
            case "minutes":
              duration.minutes = amount;
              break;
            case "hour":
            case "hours":
              duration.hours = amount;
              break;
            case "day":
            case "days":
              duration.days = amount;
              break;
            case "week":
            case "weeks":
              duration.weeks = amount;
              break;
            case "month":
            case "months":
              duration.months = amount;
              break;
            case "year":
            case "years":
              duration.years = amount;
              break;
            default:
              amount = null;
          }
        } else {
          const value = Number(word);
          if (!Number.isNaN(value)) {
            amount = value;
          }
        }
      }
    }
  }
  const value = Duration.fromObject(duration);
  if (value.isValid) return value;
  throw new Error("Invalid duration");
};

export function toHuman(
  dur: Duration,
  smallestUnit: keyof DurationLikeObject = "seconds"
): string {
  const units: Array<keyof DurationLikeObject> = [
    "years",
    "months",
    "days",
    "hours",
    "minutes",
    "seconds",
    "milliseconds",
  ];
  const smallestIdx = units.indexOf(smallestUnit);
  const entries = Object.entries(
    dur
      .shiftTo(...units)
      .normalize()
      .toObject()
  ).filter(([_unit, amount], idx) => amount > 0 && idx <= smallestIdx);
  const dur2 = Duration.fromObject(
    entries.length === 0 ? { [smallestUnit]: 0 } : Object.fromEntries(entries)
  );
  return dur2.toHuman();
}
