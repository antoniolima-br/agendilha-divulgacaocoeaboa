/** Reference-counted lifetime only; each caller retains its own transport and timing. */
export function createSharedResource<Owner extends object>(start: (owner: Owner) => () => void) {
  const resources = new WeakMap<Owner, { consumers: number; stop: () => void }>();
  return (owner: Owner): (() => void) => {
    let resource = resources.get(owner);
    if (!resource) {
      resource = { consumers: 0, stop: start(owner) };
      resources.set(owner, resource);
    }
    resource.consumers++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      resource.consumers--;
      if (resource.consumers === 0) {
        resources.delete(owner);
        resource.stop();
      }
    };
  };
}
