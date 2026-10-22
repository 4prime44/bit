import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvailabilityGrid } from "./AvailabilityGrid";
it("klawiatura: spacja zaznacza, strzałka przesuwa fokus", async () => {
  const user = userEvent.setup();
  // symuluje prawdziwe naciśnięcia klawiszy
  const onChange = vi.fn();
  // "szpieg": zapamiętuje, z czym go wywołano
  render(
    <AvailabilityGrid
      dates={["2026-10-20"]}
      rows={[540, 570]}
      value={new Set()}
      onChange={onChange}
    />,
  );
  await user.tab();
  // Tab → fokus na pierwszą komórkę
  expect(screen.getAllByRole("gridcell")[0]).toHaveFocus();
  await user.keyboard(" ");
  // spacja
  expect(onChange).toHaveBeenLastCalledWith(new Set(["2026-10-20T09:00"]));
  await user.keyboard("{ArrowDown} ");
  // strzałka w dół, potem spacja
  // value w teście się nie zmienia (brak rodzica), więc zaznaczy się tylko 9:30:
  expect(onChange).toHaveBeenLastCalledWith(new Set(["2026-10-20T09:30"]));
});
