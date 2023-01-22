import styled from "@emotion/styled";
import { useLiveQuery } from "dexie-react-hooks";
import React, { FC } from "react";
import { DateTime, Duration, DurationLikeObject } from "luxon";
import { Cycle, store } from "./store";

const Page = styled.div`
  font-family: Helvetica Neue, Arial, sans-serif;
`;

const Container = styled.article`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  & > * {
    flex: 0 0 30ch;
  }
`;

const ItemContainer = styled.section`
  background-color: #aaa;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const Wrap = styled.div``;

const getDurationFromHuman = (human: string) => {
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
        const value = Number(word);
        if (!Number.isNaN(value)) {
          amount = value;
          continue;
        }
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
        }
      }
    }
  }
  const value = Duration.fromObject(duration);
  if (value.isValid) return value;
  throw new Error("Invalid duration");
};

const Item: FC<{
  cycle?: Cycle;
  onSave: (cycle: Cycle) => void;
  now: DateTime;
}> = ({ cycle, onSave, now }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [start, setStart] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [duration, setDuration] = React.useState("");
  if (!isEditing && !cycle)
    return (
      <ItemContainer
        onClick={() => {
          const date = now.toUTC();
          setIsEditing(true);
          setTitle("");
          setStart(`${date.toSQLDate()}T${date.toFormat("HH:mm")}`);
          setDuration("every 1 day");
        }}
      >
        <h2>Add item</h2>
      </ItemContainer>
    );
  return (
    <ItemContainer>
      {isEditing ? (
        <Wrap>
          <div>
            <button
              onClick={() => {
                setIsEditing(false);
                onSave({
                  start,
                  duration,
                  title,
                });
              }}
            >
              Save
            </button>
          </div>
          <h3>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={({ currentTarget }) => {
                setTitle(currentTarget.value);
              }}
            />
          </h3>
          <p>
            <input
              type="text"
              value={duration}
              onChange={({ currentTarget }) => {
                setDuration(currentTarget.value);
              }}
              autoFocus
            />
          </p>
          <p>
            <input
              type="datetime-local"
              value={start}
              onChange={({ currentTarget }) => {
                setStart(currentTarget.value);
              }}
              autoFocus
            />
          </p>
        </Wrap>
      ) : (
        <Wrap>
          <div>
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button
              onClick={() => {
                if (!cycle?.id) return;
                store.cycles.update(cycle.id, {
                  start: `${now.toSQLDate()}T${now.toFormat("HH:mm")}`,
                });
              }}
            >
              Track
            </button>
            <button onClick={() => {
              if (!cycle?.id) return;
              store.cycles.delete(cycle.id);
            }}>remove</button>
          </div>
          <h3>{cycle?.title}</h3>
          <p>
            {cycle?.duration && getDurationFromHuman(cycle.duration).toHuman()}{" "}
            -{" "}
            {now
              .diff(DateTime.fromISO(cycle?.start || ""))
              .shiftTo("days", "hours", "minutes")
              .toHuman()} until next
          </p>
          <p>
            {cycle?.start &&
              DateTime.fromISO(cycle.start).toFormat("yyyy LLL dd HH:mm")}
          </p>
        </Wrap>
      )}
    </ItemContainer>
  );
};

const useNow = () => {
  const [now, setNow] = React.useState(DateTime.local());
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(DateTime.local());
    }, 1_000_000);
    return () => clearInterval(interval);
  }, []);
  return now;
};

function App() {
  const items = useLiveQuery(() => {
    return store.cycles.toArray();
  });
  const now = useNow();
  return (
    <Page>
      <Container>
        {items?.map((item) => {
          return (
            <Item
              now={now}
              cycle={item}
              onSave={(cycle) => {
                if (!item.id) return;
                store.cycles.update(item.id, cycle);
              }}
            />
          );
        })}
        <Item
          now={now}
          onSave={(cycle) => {
            store.cycles.add(cycle);
          }}
        ></Item>
        <button onClick={() => store.cycles.clear()}>reset</button>
      </Container>
    </Page>
  );
}

export default App;
