import { forEachWithConcurrency } from '../../utils/concurrency';

function deferred(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('forEachWithConcurrency', () => {
  it('processes every item exactly once', async () => {
    const items = Array.from({ length: 20 }, (_, index) => index);
    const seen: number[] = [];

    await forEachWithConcurrency(items, 4, async (item) => {
      await deferred(1);
      seen.push(item);
    });

    expect(seen).toHaveLength(20);
    expect([...seen].sort((a, b) => a - b)).toEqual(items);
  });

  it('never runs more workers than the configured limit', async () => {
    const items = Array.from({ length: 30 }, (_, index) => index);
    let running = 0;
    let peak = 0;

    await forEachWithConcurrency(items, 5, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await deferred(2);
      running -= 1;
    });

    expect(peak).toBe(5);
  });

  it('does not start more workers than there are items', async () => {
    let peak = 0;
    let running = 0;

    await forEachWithConcurrency([1, 2], 10, async () => {
      running += 1;
      peak = Math.max(peak, running);
      await deferred(2);
      running -= 1;
    });

    expect(peak).toBe(2);
  });

  it('resolves immediately for an empty list', async () => {
    const worker = jest.fn();
    await forEachWithConcurrency([], 5, worker);
    expect(worker).not.toHaveBeenCalled();
  });

  it('runs work in parallel rather than sequentially', async () => {
    const items = Array.from({ length: 10 }, (_, index) => index);
    const startedAt = Date.now();

    await forEachWithConcurrency(items, 10, async () => {
      await deferred(30);
    });

    expect(Date.now() - startedAt).toBeLessThan(200);
  });
});
