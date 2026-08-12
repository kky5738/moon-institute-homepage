import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  layoutLifeEvents,
  parseLifeEventDate,
  parseLifeEventsCsv,
} from "./life-events";

test("YYYY/M/D와 윤년 날짜를 엄격하게 변환한다", () => {
  assert.deepEqual(parseLifeEventDate("1977/1/1"), {
    year: 1977,
    month: 1,
    day: 1,
    timestamp: Date.UTC(1977, 0, 1),
  });
  assert.equal(parseLifeEventDate("1980/2/29").day, 29);
  assert.throws(() => parseLifeEventDate("1977-1-1"));
  assert.throws(() => parseLifeEventDate("1977/2/29"));
});

test("CSV의 쉼표, 줄바꿈, 빈 content와 뒤쪽 빈 열을 처리한다", () => {
  const csv = [
    "date,title,content,,,,",
    '1977/1/1,"쉼표, 포함","두 줄의',
    '내용",,,,',
    "1977/2/3,본문 없음,,,,,",
  ].join("\n");

  assert.deepEqual(parseLifeEventsCsv(csv), [
    { date: "1977/1/1", title: "쉼표, 포함", content: "두 줄의\n내용" },
    { date: "1977/2/3", title: "본문 없음" },
  ]);
});

test("같거나 가까운 날짜는 다른 lane에 놓고 먼 날짜는 lane을 재사용한다", () => {
  const { events, laneCount, years } = layoutLifeEvents(
    [
      { date: "1977/1/1", title: "첫 사건" },
      { date: "1977/1/1", title: "같은 날 사건" },
      { date: "1977/1/2", title: "가까운 사건" },
      { date: "1978/1/1", title: "먼 사건" },
    ],
    0.2,
  );

  assert.deepEqual(years, [1977, 1978]);
  assert.notEqual(events[0].lane, events[1].lane);
  assert.notEqual(events[1].lane, events[2].lane);
  assert.equal(events[0].lane, events[3].lane);
  assert.equal(laneCount, 3);
});

test("제공된 생애사 표본 133건을 모두 읽는다", () => {
  const csv = readFileSync("src/lib/sample life events.csv", "utf8");
  const events = parseLifeEventsCsv(csv);

  assert.equal(events.length, 133);
  assert.equal(events[0].date, "1977/1/1");
  assert.equal(events.at(-1)?.date, "1994/7/26");
  assert.equal(events.filter((event) => event.content).length, 59);
});
