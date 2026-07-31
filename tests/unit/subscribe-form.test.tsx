// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FormState } from "@/lib/form-state";

afterEach(cleanup);

/**
 * SPEC §5.9 component layer — the subscribe form's states: idle → loading →
 * success / error / rate-limited, driven through a mocked server action.
 */

const actionResult: { value: FormState } = {
  value: { status: "success", message: "Almost there — check your inbox." },
};
let resolveAction: (() => void) | null = null;

vi.mock("@/app/actions/newsletter", () => ({
  subscribeToNewsletter: vi.fn(
    () =>
      new Promise<FormState>((resolve) => {
        resolveAction = () => resolve(actionResult.value);
      }),
  ),
}));

import { SubscribeForm } from "@/components/modules/SubscribeForm";

async function submit() {
  fireEvent.input(screen.getByLabelText("Email address"), {
    target: { value: "reader@example.com" },
  });
  await act(async () => {
    fireEvent.submit(screen.getByLabelText("Email address").closest("form")!);
  });
}

async function finishAction() {
  await act(async () => {
    resolveAction?.();
  });
}

describe("SubscribeForm states", () => {
  beforeEach(() => {
    resolveAction = null;
  });

  it("idle: label, consent line, honeypot and source are all present", () => {
    const { container } = render(<SubscribeForm source="newsletter-page" variant="block" />);
    expect(screen.getByLabelText("Email address")).toBeDefined();
    expect(screen.getByText(/Double opt-in/)).toBeDefined();
    expect(container.querySelector('input[name="website"]')).not.toBeNull();
    expect(container.querySelector('input[name="source"]')).toHaveProperty(
      "value",
      "newsletter-page",
    );
  });

  it("loading: the button explains itself instead of disabling silently", async () => {
    render(<SubscribeForm source="footer" variant="footer" />);
    await submit();
    expect(screen.getByRole("button", { name: "Subscribing…" })).toBeDefined();
    await finishAction();
  });

  it("success: replaces the form with a role=status message", async () => {
    actionResult.value = { status: "success", message: "Almost there — check your inbox." };
    render(<SubscribeForm source="home" variant="block" />);
    await submit();
    await finishAction();
    expect(screen.getByRole("status").textContent).toContain("check your inbox");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("rate-limited/error: keeps the form and announces via role=alert", async () => {
    actionResult.value = {
      status: "error",
      message: "A few attempts already — wait ten minutes and try once more.",
    };
    render(<SubscribeForm source="home" variant="block" />);
    await submit();
    await finishAction();
    expect(screen.getByRole("alert").textContent).toContain("wait ten minutes");
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeDefined();
  });

  it("field error: wires aria-invalid and aria-describedby to the input", async () => {
    actionResult.value = {
      status: "error",
      message: "Check the form.",
      fieldErrors: { email: "Add your email so I can reply." },
    };
    render(<SubscribeForm source="home" variant="block" />);
    await submit();
    await finishAction();
    const input = screen.getByLabelText("Email address");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toContain("Add your email");
  });
});
