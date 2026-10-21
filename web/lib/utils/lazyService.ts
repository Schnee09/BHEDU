/**
 * Defers construction of objects that require runtime-only configuration.
 * This keeps module evaluation safe during Next.js build-time route discovery.
 */
export function createLazyService<T extends object>(factory: () => T): T {
  let instance: T | undefined;

  const getInstance = () => {
    instance ??= factory();
    return instance;
  };

  return new Proxy({} as T, {
    get(_target, property) {
      const service = getInstance();
      const value = Reflect.get(service, property, service);
      return typeof value === 'function' ? value.bind(service) : value;
    },
    set(_target, property, value) {
      return Reflect.set(getInstance(), property, value);
    },
  });
}
