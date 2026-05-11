export function diffOrders(prev: any[], next: any[]) {
  const prevMap = new Map(prev.map((o) => [o.id, o]));

  const newItems: string[] = [];
  const changed: string[] = [];

  for (const o of next) {
    const old = prevMap.get(o.id);

    if (!old) {
      newItems.push(o.id);
      continue;
    }

    if (old.status !== o.status) {
      changed.push(o.id);
    }
  }

  return { newItems, changed };
}