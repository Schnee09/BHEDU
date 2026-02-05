/**
 * Performance Monitor Utility
 *
 * Features:
 * - Component render timing
 * - API request timing
 * - User interaction tracking
 * - Performance budget alerts
 * - Metrics aggregation
 */

import { logger } from "@/lib/logger";

interface PerformanceEntry {
    name: string;
    type: "render" | "api" | "interaction" | "custom";
    startTime: number;
    duration: number;
    metadata?: Record<string, any>;
}

interface PerformanceBudget {
    name: string;
    threshold: number; // milliseconds
    type: "render" | "api" | "interaction" | "custom";
    [key: string]: unknown;
}

class PerformanceMonitor {
    private entries: PerformanceEntry[] = [];
    private maxEntries: number = 1000;
    private budgets: PerformanceBudget[] = [];
    private timers: Map<string, number> = new Map();

    constructor() {
        // Default performance budgets
        this.budgets = [
            { name: "api-request", threshold: 1000, type: "api" },
            { name: "component-render", threshold: 16, type: "render" }, // 60fps
            { name: "user-interaction", threshold: 100, type: "interaction" },
        ];
    }

    /**
     * Start timing an operation
     */
    start(name: string, type: PerformanceEntry["type"] = "custom"): void {
        const key = `${type}:${name}`;
        this.timers.set(key, performance.now());
        logger.debug("Performance timer started", { name, type });
    }

    /**
     * End timing and record entry
     */
    end(
        name: string,
        type: PerformanceEntry["type"] = "custom",
        metadata?: Record<string, any>,
    ): number {
        const key = `${type}:${name}`;
        const startTime = this.timers.get(key);

        if (!startTime) {
            logger.warn("Performance timer not found", { name, type });
            return 0;
        }

        const duration = performance.now() - startTime;
        this.timers.delete(key);

        // Record entry
        const entry: PerformanceEntry = {
            name,
            type,
            startTime,
            duration,
            metadata,
        };

        this.addEntry(entry);
        this.checkBudget(entry);

        logger.debug("Performance timer ended", {
            name,
            type,
            duration: `${duration.toFixed(2)}ms`,
            ...metadata,
        });

        return duration;
    }

    /**
     * Measure a synchronous function
     */
    measure<T>(
        name: string,
        fn: () => T,
        type: PerformanceEntry["type"] = "custom",
        metadata?: Record<string, any>,
    ): T {
        this.start(name, type);
        try {
            const result = fn();
            this.end(name, type, metadata);
            return result;
        } catch (error) {
            this.end(name, type, { ...metadata, error: true });
            throw error;
        }
    }

    /**
     * Measure an async function
     */
    async measureAsync<T>(
        name: string,
        fn: () => Promise<T>,
        type: PerformanceEntry["type"] = "custom",
        metadata?: Record<string, any>,
    ): Promise<T> {
        this.start(name, type);
        try {
            const result = await fn();
            this.end(name, type, metadata);
            return result;
        } catch (error) {
            this.end(name, type, { ...metadata, error: true });
            throw error;
        }
    }

    /**
     * Add performance entry
     */
    private addEntry(entry: PerformanceEntry): void {
        this.entries.push(entry);

        // Evict old entries if needed
        if (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
    }

    /**
     * Check if entry exceeds performance budget
     */
    private checkBudget(entry: PerformanceEntry): void {
        const budget = this.budgets.find(
            (b) =>
                b.type === entry.type &&
                (b.name === entry.name || b.name === `${entry.type}-request`),
        );

        if (budget && entry.duration > budget.threshold) {
            logger.warn("Performance budget exceeded", {
                name: entry.name,
                type: entry.type,
                duration: `${entry.duration.toFixed(2)}ms`,
                threshold: `${budget.threshold}ms`,
                exceeded: `${(entry.duration - budget.threshold).toFixed(2)}ms`,
            });
        }
    }

    /**
     * Get performance statistics
     */
    getStats(type?: PerformanceEntry["type"]) {
        const filtered = type
            ? this.entries.filter((e) => e.type === type)
            : this.entries;

        if (filtered.length === 0) {
            return null;
        }

        const durations = filtered.map((e) => e.duration);
        const sum = durations.reduce((a, b) => a + b, 0);

        return {
            count: filtered.length,
            total: sum,
            average: sum / filtered.length,
            min: Math.min(...durations),
            max: Math.max(...durations),
            median: this.getMedian(durations),
            p95: this.getPercentile(durations, 95),
            p99: this.getPercentile(durations, 99),
        };
    }

    /**
     * Get median value
     */
    private getMedian(values: number[]): number {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Get percentile value
     */
    private getPercentile(values: number[], percentile: number): number {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }

    /**
     * Get recent entries
     */
    getRecentEntries(count: number = 10, type?: PerformanceEntry["type"]) {
        const filtered = type
            ? this.entries.filter((e) => e.type === type)
            : this.entries;

        return filtered.slice(-count);
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries = [];
        this.timers.clear();
        logger.debug("Performance monitor cleared");
    }

    /**
     * Export metrics for analysis
     */
    export() {
        return {
            entries: this.entries,
            stats: {
                all: this.getStats(),
                render: this.getStats("render"),
                api: this.getStats("api"),
                interaction: this.getStats("interaction"),
                custom: this.getStats("custom"),
            },
            budgets: this.budgets,
        };
    }

    /**
     * Add custom performance budget
     */
    addBudget(budget: PerformanceBudget): void {
        this.budgets.push(budget);
        logger.debug("Performance budget added", budget);
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for component performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
    if (typeof window === "undefined") return;

    const startTime = performance.now();

    return () => {
        const duration = performance.now() - startTime;
        performanceMonitor.measure(
            componentName,
            () => {},
            "render",
            { duration },
        );
    };
}
