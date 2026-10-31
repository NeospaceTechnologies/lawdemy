import { describe, expect, it } from "vitest";
import { discountedKobo, durationLabel, formatNaira, joinDuration, nairaToKobo, splitDuration } from "./format";

describe("money", () => {
  it("converts naira input to kobo", () => {
    expect(nairaToKobo("22900")).toBe(2_290_000);
    expect(nairaToKobo("22,900.50")).toBe(2_290_050);
    expect(nairaToKobo("")).toBeNull();
    expect(nairaToKobo("-1")).toBeNull();
  });
  it("formats naira with en-NG and applies discounts", () => {
    expect(formatNaira(2_290_000)).toMatch(/22,900\.00/);
    expect(discountedKobo(2_290_000, 25)).toBe(1_717_500);
  });
});

describe("durations", () => {
  it("round-trips both formats", () => {
    expect(joinDuration("2", "30", "HOURS_MINUTES")).toBe(9000);
    expect(splitDuration(9000, "HOURS_MINUTES")).toEqual(["2", "30"]);
    expect(joinDuration("12", "05", "MINUTES_SECONDS")).toBe(725);
    expect(durationLabel(725, "MINUTES_SECONDS")).toBe("12min 5s");
  });
  it("clamps the second field to 59 and treats empty as unset", () => {
    expect(joinDuration("1", "99", "MINUTES_SECONDS")).toBe(119);
    expect(joinDuration("", "", "MINUTES_SECONDS")).toBeNull();
  });
});
