import styled from "@emotion/styled";
import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import { FC, useMemo, useState } from "react";
import { toDateTimeLocal } from "./adapters";
import { useNow } from "./hooks";
import { Cycle, store } from "./store";
import { getDurationFromHuman, toHuman } from "./utils";

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

const Item: FC<{
  cycle?: Cycle;
  onSave: (cycle: Cycle) => void;
  now: DateTime;
}> = ({ cycle, onSave, now }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [start, setStart] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");

  const status = useMemo(() => {
    if (!cycle?.start || !cycle?.duration) return undefined;
    const difference = now.diff(
      DateTime.fromISO(cycle.start).plus(getDurationFromHuman(cycle.duration))
    );
    if (difference.milliseconds < 0)
      return `next in ${toHuman(difference.negate())}`;
    return `overdue by ${toHuman(difference)}`;
  }, [cycle?.duration, cycle?.start, now]);
  if (!isEditing && !cycle)
    return (
      <ItemContainer
        onClick={() => {
          const date = now.toUTC();
          setIsEditing(true);
          setTitle("");
          setStart(toDateTimeLocal(date));
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
                  start: toDateTimeLocal(now),
                });
              }}
            >
              Track
            </button>
            <button
              onClick={() => {
                if (!cycle?.id) return;
                store.cycles.delete(cycle.id);
              }}
            >
              Remove
            </button>
          </div>
          <h3>{cycle?.title}</h3>
          <p>
            {cycle?.duration}
            {status && ` ● ${status}`}
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
