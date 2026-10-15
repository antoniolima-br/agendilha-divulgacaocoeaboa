import { describe, expect, it, vi } from "vitest";
import { createSharedResource } from "./sharedResource";

describe("shared resource lifetime", () => {
  it("starts once and stops only when the last consumer releases", () => {
    const stop = vi.fn();
    const start = vi.fn(() => stop);
    const acquire = createSharedResource(start);
    const owner = {};
    const first = acquire(owner);
    const second = acquire(owner);
    expect(start).toHaveBeenCalledTimes(1);
    first();
    first();
    expect(stop).not.toHaveBeenCalled();
    second();
    expect(stop).toHaveBeenCalledTimes(1);
    acquire(owner)();
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledTimes(2);
  });

  it("isolates owners and separate resource factories", () => {
    const stop = vi.fn();
    const start = vi.fn(() => stop);
    const acquire = createSharedResource(start);
    const otherAcquire = createSharedResource(start);
    const owner = {};
    const release = acquire(owner);
    const otherOwner = acquire({});
    const otherResource = otherAcquire(owner);
    expect(start).toHaveBeenCalledTimes(3);
    release();
    expect(stop).toHaveBeenCalledTimes(1);
    otherOwner();
    otherResource();
    expect(stop).toHaveBeenCalledTimes(3);
  });
});