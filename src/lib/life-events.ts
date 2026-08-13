export type LifeEvent = {
  date: string;
  title: string;
  content?: string;
};

export type TimelineEvent = LifeEvent & {
  id: string;
  lane: number;
  position: number;
};

export type LifeEventYearGroup = {
  year: number;
  events: LifeEvent[];
};

export function parseLifeEventDate(value: string) {
  const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(value.trim());

  if (!match) {
    throw new Error(`날짜 형식이 올바르지 않습니다: ${value}`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`존재하지 않는 날짜입니다: ${value}`);
  }

  return { year, month, day, timestamp };
}

export function formatLifeEventDate(value: string) {
  const { year, month, day } = parseLifeEventDate(value);
  return `${year}. ${month}. ${day}.`;
}

export function parseLifeEventsCsv(csv: string): LifeEvent[] {
  const rows = parseCsvRows(csv.replace(/^\uFEFF/, ""));
  const [headers, ...dataRows] = rows;

  if (
    headers?.[0]?.trim() !== "date" ||
    headers?.[1]?.trim() !== "title" ||
    headers?.[2]?.trim() !== "content"
  ) {
    throw new Error("생애사 CSV의 첫 세 열은 date, title, content여야 합니다.");
  }

  return dataRows.flatMap((row, index) => {
    if (row.every((field) => field.trim() === "")) {
      return [];
    }

    const date = row[0]?.trim() ?? "";
    const title = row[1]?.trim() ?? "";
    const content = row[2]?.trim();

    parseLifeEventDate(date);

    if (!title) {
      throw new Error(`생애사 CSV ${index + 2}행의 title이 비어 있습니다.`);
    }

    return [{ date, title, ...(content ? { content } : {}) }];
  });
}

export function groupLifeEventsByYear(events: LifeEvent[]) {
  const groups = new Map<number, LifeEvent[]>();

  for (const event of events) {
    const { year } = parseLifeEventDate(event.date);
    const group = groups.get(year);
    if (group) {
      group.push(event);
    } else {
      groups.set(year, [event]);
    }
  }

  return [...groups]
    .sort(([yearA], [yearB]) => yearA - yearB)
    .map(([year, groupedEvents]): LifeEventYearGroup => ({
      year,
      events: groupedEvents,
    }));
}

export function getYearTicks(years: number[]) {
  const interval =
    years.length <= 20 ? 1 : years.length <= 40 ? 2 : years.length <= 100 ? 5 : 10;

  return years.filter(
    (_, index) => index % interval === 0 || index === years.length - 1,
  );
}

export function layoutLifeEvents(
  events: LifeEvent[],
  minimumGap = 0.025,
  selectedYear?: number,
) {
  if (events.length === 0) {
    return { events: [] as TimelineEvent[], years: [] as number[], laneCount: 0 };
  }

  const datedEvents = events
    .map((event, index) => ({ event, index, ...parseLifeEventDate(event.date) }))
    .filter(({ year }) => selectedYear === undefined || year === selectedYear)
    .sort((a, b) => a.timestamp - b.timestamp || a.index - b.index);

  if (datedEvents.length === 0) {
    return { events: [] as TimelineEvent[], years: [] as number[], laneCount: 0 };
  }

  const firstYear = selectedYear ?? datedEvents[0].year;
  const lastYear = selectedYear ?? datedEvents.at(-1)!.year;
  const start = Date.UTC(firstYear, 0, 1);
  const end = Date.UTC(lastYear + 1, 0, 1);
  const laneEnds: number[] = [];

  const positioned = datedEvents.map(({ event, index, timestamp }) => {
    const position = (timestamp - start) / (end - start);
    let lane = laneEnds.findIndex((previous) => position - previous >= minimumGap);

    if (lane === -1) {
      lane = laneEnds.length;
    }

    laneEnds[lane] = position;

    return {
      ...event,
      id: `${event.date}-${index}`,
      lane,
      position,
    };
  });

  return {
    events: positioned,
    years: Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => firstYear + index,
    ),
    laneCount: laneEnds.length,
  };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("생애사 CSV의 따옴표가 닫히지 않았습니다.");
  }

  if (field || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}
