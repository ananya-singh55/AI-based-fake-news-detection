import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VeritasApp, { toneColor, timeAgo } from "./App";

// ---------------------------------------------------------------
// Unit tests: pure utilities
// ---------------------------------------------------------------
describe("toneColor", () => {
  test("returns teal for teal and real", () => {
    expect(toneColor("teal")).toBe("#2DD4BF");
    expect(toneColor("real")).toBe("#2DD4BF");
  });

  test("returns red for red and fake", () => {
    expect(toneColor("red")).toBe("#E5484D");
    expect(toneColor("fake")).toBe("#E5484D");
  });

  test("returns amber for anything else", () => {
    expect(toneColor("unknown")).toBe("#F5A623");
  });
});

describe("timeAgo", () => {
  test("returns 'just now' under a minute", () => {
    expect(timeAgo(new Date(Date.now() - 30_000))).toBe("just now");
  });

  test("returns 'Xm ago' under an hour", () => {
    expect(timeAgo(new Date(Date.now() - 5 * 60_000))).toBe("5m ago");
  });

  test("returns 'Xh ago' under a day", () => {
    expect(timeAgo(new Date(Date.now() - 3 * 3600_000))).toBe("3h ago");
  });

  test("returns 'Xd ago' after a day", () => {
    expect(timeAgo(new Date(Date.now() - 2 * 86400_000))).toBe("2d ago");
  });
});

// ---------------------------------------------------------------
// Integration tests: user flows through VeritasApp
// ---------------------------------------------------------------
describe("Veritas app", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders the home page hero", () => {
    render(<VeritasApp />);
    expect(
      screen.getByRole("heading", { name: /read its signal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /analyze a story/i })
    ).toBeInTheDocument();
  });

  test("navigates to the analyzer page", async () => {
    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /news analyzer/i,
    });
    await userEvent.click(navButtons[0]);

    expect(
      screen.getByRole("heading", {
        name: /analyze information before you trust it/i,
      })
    ).toBeInTheDocument();
  });

  test("shows empty state on the history page", async () => {
    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /verification history/i,
    });
    await userEvent.click(navButtons[0]);

    expect(
      screen.getByRole("heading", { name: /nothing analyzed yet/i })
    ).toBeInTheDocument();
  });

  test("logs in with correct credentials and lands on dashboard", async () => {
    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /login \/ register/i,
    });
    await userEvent.click(navButtons[0]);

    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "admin@veritas.com"
    );
    // Submitting via Enter avoids the "Log in" tab vs "Log in" submit ambiguity
    await userEvent.type(
      screen.getByPlaceholderText(/xxxxxxx/i),
      "Veritas@123{Enter}"
    );

    expect(
      await screen.findByRole("heading", {
        name: /your verification activity/i,
      })
    ).toBeInTheDocument();
  });

  test("shows an alert for incorrect credentials", async () => {
    vi.stubGlobal("alert", vi.fn());

    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /login \/ register/i,
    });
    await userEvent.click(navButtons[0]);

    await userEvent.type(
      screen.getByPlaceholderText(/you@example\.com/i),
      "wrong@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText(/xxxxxxx/i),
      "wrongpass{Enter}"
    );

    expect(window.alert).toHaveBeenCalledWith("Invalid username or password.");
  });

  test("analyzer does not call the backend for empty input", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /news analyzer/i,
    });
    await userEvent.click(navButtons[0]);

    await userEvent.click(
      screen.getByRole("button", { name: /analyze content/i })
    );

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("analyzer POSTs to /api/predict and renders the result page", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        prediction: "fake",
        probability_real: 0.15,
        probability_fake: 0.85,
        confidence: 85,
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<VeritasApp />);
    const navButtons = screen.getAllByRole("button", {
      name: /news analyzer/i,
    });
    await userEvent.click(navButtons[0]);

    await userEvent.type(
      screen.getByPlaceholderText(/paste the headline/i),
      "Breaking news sample"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /analyze content/i })
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/predict"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "text",
            input: "Breaking news sample",
          }),
        })
      );
    });

    expect(
      await screen.findByRole("heading", { name: /verification assessment/i })
    ).toBeInTheDocument();
  });
});