import { DateTime } from "luxon";

export const toDateTimeLocal = (date: DateTime) => {
  return date.toFormat("yyyy-MM-dd'T'HH:mm");
}