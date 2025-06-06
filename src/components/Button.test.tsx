import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button Component", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByTestId("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies primary variant classes by default", () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByTestId("button");

    expect(button).toHaveClass("bg-blue-600", "text-white");
  });

  it("applies secondary variant classes", () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByTestId("button");

    expect(button).toHaveClass("bg-gray-200", "text-gray-900");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByTestId("button");

    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:bg-blue-300");
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled Button
      </Button>
    );

    fireEvent.click(screen.getByTestId("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByTestId("button");

    expect(button).toHaveClass("custom-class");
  });

  it("has correct accessibility attributes", () => {
    render(<Button>Accessible Button</Button>);
    const button = screen.getByTestId("button");

    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeVisible();
  });
});
