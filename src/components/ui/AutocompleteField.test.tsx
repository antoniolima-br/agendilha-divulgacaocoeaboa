import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AutocompleteField } from "./AutocompleteField";
import { Search } from "lucide-react";

describe("AutocompleteField", () => {
  const items = [{ id: "1", name: "Item 1" }, { id: "2", name: "Item 2" }];
  const renderItem = (item: any, onSelect: any) => (
    <button key={item.id} onClick={onSelect} data-testid={"item-" + item.id}>
      {item.name}
    </button>
  );

  it("renders input and shows dropdown on focus", async () => {
    const onChange = vi.fn();
    render(
      <AutocompleteField
        value=""
        onChange={onChange}
        loading={false}
        error={null}
        items={items}
        renderItem={renderItem}
        placeholder="Search here"
      />
    );

    const input = screen.getByPlaceholderText("Search here");
    fireEvent.focus(input);

    expect(screen.getByTestId("item-1")).toBeDefined();
    expect(screen.getByTestId("item-2")).toBeDefined();
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteField
        value=""
        onChange={onChange}
        loading={false}
        error={null}
        items={[]}
        renderItem={renderItem}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("shows loading state", () => {
    render(
      <AutocompleteField
        value="test"
        onChange={() => {}}
        loading={true}
        error={null}
        items={[]}
        renderItem={renderItem}
        loadingText="Loading results..."
      />
    );
    
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    expect(screen.getByText("Loading results...")).toBeDefined();
  });

  it("shows create new button", () => {
    const onCreateNew = vi.fn();
    render(
      <AutocompleteField
        value="New Item"
        onChange={() => {}}
        loading={false}
        error={null}
        items={[]}
        renderItem={renderItem}
        onCreateNew={onCreateNew}
        createNewText="Create New"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    
    const createBtn = screen.getByText(/Create New/);
    fireEvent.click(createBtn);
    expect(onCreateNew).toHaveBeenCalledWith("New Item");
  });
});
