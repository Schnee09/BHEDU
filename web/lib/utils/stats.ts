export function asNumber(n: any): number | null {
    if (n === null || n === undefined) return null;
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
}

export function median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}
