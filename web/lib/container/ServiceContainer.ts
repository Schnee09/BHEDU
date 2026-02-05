/**
 * ServiceContainer
 *
 * Dependency Injection Container for managing service instances.
 * Supports both transient and singleton registrations.
 *
 * @example
 * ```typescript
 * // Get service
 * const classService = container.get(TOKENS.ClassService);
 *
 * // In tests, override with mock
 * container.register(TOKENS.ClassService, () => mockClassService);
 * ```
 */

import type { ServiceToken } from "./tokens";

type Factory<T> = () => T;

interface Registration<T> {
    factory: Factory<T>;
    singleton: boolean;
    instance?: T;
}

export class ServiceContainer {
    private registry = new Map<string, Registration<any>>();

    /**
     * Register a transient service (new instance each time)
     */
    register<T>(token: ServiceToken<T>, factory: Factory<T>): this {
        this.registry.set(token.name, {
            factory,
            singleton: false,
        });
        return this;
    }

    /**
     * Register a singleton service (reuse same instance)
     */
    registerSingleton<T>(token: ServiceToken<T>, factory: Factory<T>): this {
        this.registry.set(token.name, {
            factory,
            singleton: true,
        });
        return this;
    }

    /**
     * Get a service instance by token
     */
    get<T>(token: ServiceToken<T>): T {
        const registration = this.registry.get(token.name);

        if (!registration) {
            throw new Error(`Service not registered: ${token.name}`);
        }

        // Singleton: return cached instance or create one
        if (registration.singleton) {
            if (!registration.instance) {
                registration.instance = registration.factory();
            }
            return registration.instance;
        }

        // Transient: always create new instance
        return registration.factory();
    }

    /**
     * Check if a service is registered
     */
    has<T>(token: ServiceToken<T>): boolean {
        return this.registry.has(token.name);
    }

    /**
     * Clear all registrations (useful for testing)
     */
    clear(): void {
        this.registry.clear();
    }

    /**
     * Reset singleton instances (useful for testing)
     */
    resetSingletons(): void {
        for (const registration of this.registry.values()) {
            if (registration.singleton) {
                registration.instance = undefined;
            }
        }
    }
}

// Default global container instance
export const container = new ServiceContainer();
