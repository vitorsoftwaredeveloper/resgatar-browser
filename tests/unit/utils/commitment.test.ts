import { describe, expect, it } from "vitest";
import {
  ORDINAL_OPTIONS,
  WEEKDAY_OPTIONS,
  commitmentScheduleLabel,
  isCommitmentToday,
} from "@/utils/commitment";

const QUARTA = new Date(2026, 5, 3);
const QUINTA = new Date(2026, 5, 4);

describe("WEEKDAY_OPTIONS", () => {
  it("lista os sete dias começando no domingo", () => {
    expect(WEEKDAY_OPTIONS).toHaveLength(7);
    expect(WEEKDAY_OPTIONS[0]).toEqual({ label: "Domingo", value: 0 });
    expect(WEEKDAY_OPTIONS[6]).toEqual({ label: "Sábado", value: 6 });
  });
});

describe("ORDINAL_OPTIONS", () => {
  it("vai de 1º a 5º mais Último", () => {
    expect(ORDINAL_OPTIONS.map((o) => o.value)).toEqual([1, 2, 3, 4, 5, "last"]);
  });
});

describe("commitmentScheduleLabel", () => {
  it("descreve o compromisso semanal", () => {
    expect(
      commitmentScheduleLabel({ repeat: "weekly", day: "Quarta", date: null }),
    ).toBe("Toda Quarta");
  });

  it("acrescenta a data quando é evento único", () => {
    expect(
      commitmentScheduleLabel({
        repeat: "once",
        day: "Quarta",
        date: "2026-06-03T12:00:00.000Z",
      }),
    ).toBe("Quarta, 03/06");
  });

  it("não desloca o dia quando a data vem date-only", () => {
    expect(
      commitmentScheduleLabel({
        repeat: "once",
        day: "Quarta",
        date: "2026-06-03",
      }),
    ).toBe("Quarta, 03/06");
  });

  it("não desloca o dia quando a data vem em UTC como a API devolve", () => {
    expect(
      commitmentScheduleLabel({
        repeat: "once",
        day: "Quarta",
        date: "2026-06-03T12:00:00.000Z",
      }),
    ).toBe("Quarta, 03/06");
  });

  it("devolve só o dia quando não há data", () => {
    expect(
      commitmentScheduleLabel({ repeat: "once", day: "Quarta", date: null }),
    ).toBe("Quarta");
  });

  it("preenche dia e mês com zero à esquerda", () => {
    expect(
      commitmentScheduleLabel({
        repeat: "once",
        day: "Quinta",
        date: "2026-01-05T12:00:00.000Z",
      }),
    ).toBe("Quinta, 05/01");
  });
});

describe("isCommitmentToday", () => {
  it("casa o compromisso semanal com o dia da semana atual", () => {
    expect(
      isCommitmentToday({ repeat: "weekly", day: "Quarta", date: null }, QUARTA),
    ).toBe(true);
    expect(
      isCommitmentToday({ repeat: "weekly", day: "Quinta", date: null }, QUARTA),
    ).toBe(false);
  });

  it("ignora acento e caixa ao comparar o dia", () => {
    expect(
      isCommitmentToday(
        { repeat: "weekly", day: "quarta", date: null },
        QUARTA,
      ),
    ).toBe(true);
    expect(
      isCommitmentToday(
        { repeat: "weekly", day: "SÁBADO", date: null },
        new Date(2026, 5, 6),
      ),
    ).toBe(true);
  });

  it("compara a data exata no evento único", () => {
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03T12:00:00.000Z" },
        QUARTA,
      ),
    ).toBe(true);
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03T12:00:00.000Z" },
        QUINTA,
      ),
    ).toBe(false);
  });

  it("casa a data date-only com o dia local", () => {
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03" },
        QUARTA,
      ),
    ).toBe(true);
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03" },
        QUINTA,
      ),
    ).toBe(false);
  });

  it("casa a data em UTC como a API devolve com o dia local", () => {
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03T12:00:00.000Z" },
        QUARTA,
      ),
    ).toBe(true);
    expect(
      isCommitmentToday(
        { repeat: "once", day: "Quarta", date: "2026-06-03T12:00:00.000Z" },
        QUINTA,
      ),
    ).toBe(false);
  });

  it("é falso quando o evento único não tem data", () => {
    expect(
      isCommitmentToday({ repeat: "once", day: "Quarta", date: null }, QUARTA),
    ).toBe(false);
  });
});
