import { IMaintenance } from 'models/storage/IMaintenance';
import { Appearance } from 'models/database/Appearance';
import { openDatabase } from 'models/database/functions';
import { IMember } from 'models/database/IMember';
import { runFullMaintenance, runScheduledMaintenance } from 'models/database/maintenance-functions';

/**
 * These tests run against the browser's real IndexedDB and image encoders, in
 * the test page's own origin, so they don't touch the extension's data.
 */
describe('maintenance', () => {
  let storage: { maintenance?: IMaintenance };

  beforeEach(async () => {
    storage = {};
    Object.assign(window, {
      chrome: {
        storage: {
          local: {
            get: async (keys: string[]) => Object.fromEntries(keys.map(key => [key, storage[key]])),
            set: async (items: object) => Object.assign(storage, items)
          }
        }
      }
    });
    spyOn(console, 'log');
    await deleteDatabase();
  });

  afterAll(() => deleteDatabase());

  describe('appearances', () => {
    it('converts PNG data URLs to WebP blobs', async () => {
      const png = await createPngDataUrl(20, 40);
      await putAll('appearances', [
        createAppearance(1, 1, png),
        createAppearance(1, 2, png),
        createAppearance(2, 1, png)
      ]);

      await runFullMaintenance();

      const appearances = await getAll<Appearance>('appearances');
      expect(appearances.length).toBe(3);
      for (const appearance of appearances) {
        expect(appearance.appearance).toBeInstanceOf(Blob);
        expect((appearance.appearance as Blob).type).toBe('image/webp');
        const bitmap = await createImageBitmap(appearance.appearance as Blob);
        expect([bitmap.width, bitmap.height]).toEqual([20, 40]);
        bitmap.close();
      }
    });

    it('keeps the other fields of converted appearances', async () => {
      const original = createAppearance(1, 2, await createPngDataUrl(4, 4));
      await putAll('appearances', [original]);

      await runFullMaintenance();

      const [converted] = await getAll<Appearance>('appearances');
      expect(converted.contextMemberNumber).toBe(1);
      expect(converted.memberNumber).toBe(2);
      expect(converted.appearanceMetaData).toEqual(original.appearanceMetaData);
      expect(converted.timestamp).toEqual(original.timestamp);
    });

    it('leaves existing blobs alone', async () => {
      const blob = new Blob(['not really an image'], { type: 'image/webp' });
      await putAll('appearances', [createAppearance(1, 1, blob)]);

      await runFullMaintenance();

      const [appearance] = await getAll<Appearance>('appearances');
      expect(await (appearance.appearance as Blob).text()).toBe('not really an image');
    });

    it('skips images that cannot be decoded and continues with the rest', async () => {
      const broken = 'data:image/png;base64,' + btoa('not a png');
      await putAll('appearances', [
        createAppearance(1, 1, broken),
        createAppearance(1, 2, await createPngDataUrl(4, 4))
      ]);

      await runFullMaintenance();

      const [first, second] = await getAll<Appearance>('appearances');
      expect(first.appearance).toBe(broken);
      expect((second.appearance as Blob).type).toBe('image/webp');
    });
  });

  describe('scheduling', () => {
    beforeEach(async () => {
      await putAll('members', Array.from({ length: 300 }, (_, i) => createMember(1 + i % 3, i)));
      await putAll('appearances', [createAppearance(3, 1, await createPngDataUrl(4, 4))]);
    });

    it('does not start a new pass within an hour of the last one', async () => {
      storage.maintenance = { lastCompleted: Date.now() - 60_000 };

      await runScheduledMaintenance();

      const [appearance] = await getAll<Appearance>('appearances');
      expect(typeof appearance.appearance).toBe('string');
      expect(storage.maintenance).toEqual({ lastCompleted: jasmine.any(Number) });
    });

    it('finishes a pass within one run when there is enough time', async () => {
      await runScheduledMaintenance();

      const [appearance] = await getAll<Appearance>('appearances');
      expect(appearance.appearance).toBeInstanceOf(Blob);
      expect(storage.maintenance.resume).toBeUndefined();
      expect(storage.maintenance.lastCompleted).toBeCloseTo(Date.now(), -3);
    });

    it('pauses at the time limit and resumes where it left off', async () => {
      // Every call advances the clock, so a run quickly exceeds its time limit.
      let now = Date.now();
      spyOn(Date, 'now').and.callFake(() => now += 50);

      const positions: IMaintenance['resume'][] = [];
      for (let run = 0; run < 100 && (run === 0 || storage.maintenance.resume); run++) {
        await runScheduledMaintenance();
        positions.push(storage.maintenance.resume);
      }

      expect(positions.length).toBeGreaterThan(2);
      expect(positions.at(-1)).toBeUndefined();
      // Positions only ever move forward
      const paused = positions.slice(0, -1).map(({ store, after }) => [store === 'members' ? 0 : 1, ...after ?? []]);
      for (let i = 1; i < paused.length; i++) {
        expect(indexedDB.cmp(paused[i], paused[i - 1])).toBe(1);
      }

      const [appearance] = await getAll<Appearance>('appearances');
      expect(appearance.appearance).toBeInstanceOf(Blob);
      expect((await getAll<IMember>('members')).length).toBe(300);
    });

    it('continues a paused pass even within an hour of the last one', async () => {
      storage.maintenance = {
        lastCompleted: Date.now() - 60_000,
        resume: { store: 'appearances' }
      };

      await runScheduledMaintenance();

      const [appearance] = await getAll<Appearance>('appearances');
      expect(appearance.appearance).toBeInstanceOf(Blob);
      expect(storage.maintenance.resume).toBeUndefined();
    });
  });
});

function createMember(playerMemberNumber: number, memberNumber: number): IMember {
  return {
    playerMemberNumber,
    memberNumber,
    memberName: `Member ${memberNumber}`
  } as IMember;
}

function createAppearance(contextMemberNumber: number, memberNumber: number, appearance: Blob | string): Appearance {
  return {
    contextMemberNumber,
    memberNumber,
    appearance,
    appearanceMetaData: {
      canvasHeight: 1000,
      heightModifier: 0,
      heightRatio: 1,
      heightRatioProportion: 1,
      isInverted: false
    },
    timestamp: new Date(2024, 0, 1)
  };
}

async function createPngDataUrl(width: number, height: number) {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = 'red';
  context.fillRect(0, 0, width, height / 2);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('bclub-tools');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked by an open connection'));
  });
}

async function putAll(store: 'appearances' | 'members', values: object[]) {
  const db = await openDatabase();
  try {
    const transaction = db.transaction(store, 'readwrite');
    values.forEach(value => transaction.objectStore(store).put(value));
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

async function getAll<T>(store: 'appearances' | 'members') {
  const db = await openDatabase();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const request = db.transaction(store).objectStore(store).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
