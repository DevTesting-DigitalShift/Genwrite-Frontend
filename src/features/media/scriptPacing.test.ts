import { describe, expect, it } from "vitest"
import { extractQuotedScript, pacingAdvice } from "./scriptPacing"

const SCRIPT =
  "What if the right mantra could actually change your daily routine? This is Mantra Dhyan Rhythms. Deeper meditation or a mantra for a specific goal, you can find the right spiritual rhythm for whatever moment you need it. Bring a little more peace into your everyday life. Mantra Dhyan Rhythms today."

describe("scriptPacing", () => {
  it("pulls quoted lines (straight or curly quotes) out of a prompt", () => {
    expect(extractQuotedScript('A man says: "Hello there." then “Bye now.”')).toBe(
      "Hello there. Bye now."
    )
    expect(extractQuotedScript("no script here")).toBeNull()
  })

  it("flags a script that would be rushed and suggests the shortest duration that fits", () => {
    const advice = pacingAdvice(`He says: "${SCRIPT}"`, 15, [5, 10, 15, 20, 25, 30])
    expect(advice).toEqual({ words: 51, neededSeconds: 22, suggestedDuration: 25 })
  })

  it("says nothing when the script fits", () => {
    expect(pacingAdvice('She says: "Try it today."', 5, [5, 10])).toBeNull()
  })

  it("has no suggestion when no offered duration is long enough", () => {
    expect(pacingAdvice(`"${SCRIPT}"`, 10, [5, 8, 10])?.suggestedDuration).toBeNull()
  })
})
