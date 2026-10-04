import { IChatLog } from 'models/database/IChatLog';
import { IChatSessionRecord } from 'models/database/IChatSessionRecord';
import { IMember } from 'models/database/IMember';
import { recordChatSessions } from 'models/database/chat-session-functions';
import { openDatabase, startTransaction } from 'models/database/functions';
import { ChatLogsService } from 'src/app/shared/chat-logs.service';
import { DatabaseService } from 'src/app/shared/database.service';
import { MemberService } from 'src/app/shared/member.service';

/**
 * These tests run against the browser's real IndexedDB, in the test page's own
 * origin, so they don't touch the extension's data.
 */
describe('paged queries', () => {
  beforeEach(async () => {
    // Open connections are closed with an alert when the database is deleted
    spyOn(window, 'alert');
    spyOn(console, 'warn');
    await deleteDatabase();
  });

  afterAll(() => deleteDatabase());

  describe('upgrade to version 7', () => {
    it('creates a chat session for every session in the existing chat logs', async () => {
      await createVersion6Database([
        createChatLog(1, 'a', 'Room', '2024-01-01T10:00:00Z'),
        createChatLog(1, 'a', 'Room', '2024-01-01T09:00:00Z'),
        createChatLog(1, 'a', 'Other', '2024-01-01T11:00:00Z'),
        createChatLog(1, 'b', 'Room', '2024-01-02T10:00:00Z'),
        createChatLog(2, 'c', 'Room', '2024-01-03T10:00:00Z')
      ]);

      const sessions = await getAll<IChatSessionRecord>('chatSessions');

      expect(sessions.map(s => [s.memberNumber, s.sessionId, s.chatRoom, s.chatRoomSortKey, s.start.toISOString()])).toEqual([
        [1, 'a', 'Other', 'OTHER', '2024-01-01T11:00:00.000Z'],
        // The first chat log that was written is the start
        [1, 'a', 'Room', 'ROOM', '2024-01-01T10:00:00.000Z'],
        [1, 'b', 'Room', 'ROOM', '2024-01-02T10:00:00.000Z'],
        [2, 'c', 'Room', 'ROOM', '2024-01-03T10:00:00.000Z']
      ]);
    });

    it('skips chat logs that cannot be used as a session', async () => {
      const invalid = createChatLog(1, 'a', 'Room', 'not a date');
      await createVersion6Database([invalid, createChatLog(1, 'b', 'Room', '2024-01-01T10:00:00Z')]);

      const sessions = await getAll<IChatSessionRecord>('chatSessions');

      expect(sessions.map(s => s.sessionId)).toEqual(['b']);
    });
  });

  describe('recordChatSessions', () => {
    it('keeps the earliest start of a session', async () => {
      await writeChatLogs([createChatLog(1, 'a', 'Room', '2024-01-01T10:00:00Z')]);
      await writeChatLogs([
        createChatLog(1, 'a', 'Room', '2024-01-01T11:00:00Z'),
        createChatLog(1, 'a', 'Room', '2024-01-01T08:00:00Z'),
        createChatLog(1, 'a', 'Room', '2024-01-01T09:00:00Z')
      ]);

      const sessions = await getAll<IChatSessionRecord>('chatSessions');

      expect(sessions.length).toBe(1);
      expect(sessions[0].start.toISOString()).toBe('2024-01-01T08:00:00.000Z');
    });
  });

  describe('ChatLogsService.findChatSessionsPage', () => {
    let service: ChatLogsService;

    beforeEach(async () => {
      service = new ChatLogsService(new DatabaseService());
      await writeChatLogs([
        createChatLog(1, 'a', 'beta', '2024-01-01T10:00:00Z'),
        createChatLog(1, 'b', 'Alpha', '2024-01-02T10:00:00Z'),
        createChatLog(1, 'c', 'Gamma', '2024-01-03T10:00:00Z'),
        createChatLog(1, 'd', 'delta', '2024-01-04T10:00:00Z'),
        createChatLog(1, 'e', 'Epsilon', '2024-01-05T10:00:00Z'),
        createChatLog(2, 'f', 'Alpha', '2024-01-06T10:00:00Z')
      ]);
    });

    it('sorts on start date', async () => {
      const page = await service.findChatSessionsPage(1, 'start', 'desc', 0, 10);

      expect(page.total).toBe(5);
      expect(page.rows.map(row => row.sessionId)).toEqual(['e', 'd', 'c', 'b', 'a']);
      expect(page.rows[0]).toEqual({ sessionId: 'e', chatRoom: 'Epsilon', start: new Date('2024-01-05T10:00:00Z') });
    });

    it('sorts on chat room, ignoring case', async () => {
      const ascending = await service.findChatSessionsPage(1, 'chatRoom', 'asc', 0, 10);
      const descending = await service.findChatSessionsPage(1, 'chatRoom', 'desc', 0, 10);

      expect(ascending.rows.map(row => row.chatRoom)).toEqual(['Alpha', 'beta', 'delta', 'Epsilon', 'Gamma']);
      expect(descending.rows.map(row => row.chatRoom)).toEqual(['Gamma', 'Epsilon', 'delta', 'beta', 'Alpha']);
    });

    it('pages', async () => {
      const first = await service.findChatSessionsPage(1, 'start', 'asc', 0, 2);
      const last = await service.findChatSessionsPage(1, 'start', 'asc', 2, 2);
      const beyond = await service.findChatSessionsPage(1, 'start', 'asc', 3, 2);

      expect(first.rows.map(row => row.sessionId)).toEqual(['a', 'b']);
      expect(last.rows.map(row => row.sessionId)).toEqual(['e']);
      expect(beyond).toEqual({ total: 5, rows: [] });
    });

    it('returns nothing for an unknown player', async () => {
      expect(await service.findChatSessionsPage(3, 'start', 'desc', 0, 10)).toEqual({ total: 0, rows: [] });
    });
  });

  describe('MemberService', () => {
    let service: MemberService;

    beforeEach(async () => {
      service = new MemberService(new DatabaseService());
      await putAll('members', [
        createMember(1, 30, { memberName: 'bob', lastSeen: new Date('2024-01-03T10:00:00Z') }),
        createMember(1, 10, { memberName: 'Alice', nickname: 'Ally', lastSeen: new Date('2024-01-01T10:00:00Z') }),
        createMember(1, 20, { memberName: 'Carol', normalizedNickname: 'Caz' }),
        createMember(1, 40, { memberName: 'Dave', lastSeen: new Date('2024-01-02T10:00:00Z') }),
        // Without a name, so not shown
        createMember(1, 50, { lastSeen: new Date('2024-01-04T10:00:00Z') }),
        createMember(2, 10, { memberName: 'Alice', lastSeen: new Date('2024-01-05T10:00:00Z') })
      ]);
    });

    const numbers = (keys: [number, number][]) => keys.map(key => key[1]);

    it('sorts on name, case sensitive', async () => {
      expect(numbers(await service.findMemberKeys(1, 'memberName', 'asc'))).toEqual([10, 20, 40, 30]);
      expect(numbers(await service.findMemberKeys(1, 'memberName', 'desc'))).toEqual([30, 40, 20, 10]);
    });

    it('sorts on member number', async () => {
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc'))).toEqual([10, 20, 30, 40]);
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'desc'))).toEqual([40, 30, 20, 10]);
    });

    it('sorts on last seen, with members that were never seen as the oldest', async () => {
      expect(numbers(await service.findMemberKeys(1, 'lastSeen', 'asc'))).toEqual([20, 10, 40, 30]);
      expect(numbers(await service.findMemberKeys(1, 'lastSeen', 'desc'))).toEqual([30, 40, 10, 20]);
    });

    it('filters on name, nickname and normalized nickname, case insensitive', async () => {
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberName: 'al' }))).toEqual([10]);
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberName: 'ally' }))).toEqual([10]);
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberName: 'CAZ' }))).toEqual([20]);
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberName: 'a' }))).toEqual([10, 20, 40]);
    });

    it('filters on member number', async () => {
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberNumber: '0' }))).toEqual([10, 20, 30, 40]);
      expect(numbers(await service.findMemberKeys(1, 'memberNumber', 'asc', { memberNumber: '3' }))).toEqual([30]);
    });

    it('filters on last seen range', async () => {
      const start = new Date('2024-01-01T12:00:00Z');
      const end = new Date('2024-01-02T12:00:00Z');
      expect(numbers(await service.findMemberKeys(1, 'lastSeen', 'asc', { lastSeenStart: start }))).toEqual([40, 30]);
      expect(numbers(await service.findMemberKeys(1, 'lastSeen', 'asc', { lastSeenEnd: end }))).toEqual([10, 40]);
      expect(numbers(await service.findMemberKeys(1, 'lastSeen', 'asc', { lastSeenStart: start, lastSeenEnd: end }))).toEqual([40]);
    });

    it('combines filters', async () => {
      const keys = await service.findMemberKeys(1, 'memberName', 'asc', { memberName: 'a', lastSeenStart: new Date('2024-01-01T12:00:00Z') });
      expect(numbers(keys)).toEqual([40]);
    });

    it('retrieves the overview items in the order of the keys', async () => {
      const items = await service.getMemberOverviewItems([[1, 40], [1, 10], [1, 99]]);

      expect(items).toEqual([
        { memberName: 'Dave', memberNickname: undefined, memberNormalizedNickname: undefined, memberNumber: 40, lastSeen: new Date('2024-01-02T10:00:00Z') },
        { memberName: 'Alice', memberNickname: 'Ally', memberNormalizedNickname: undefined, memberNumber: 10, lastSeen: new Date('2024-01-01T10:00:00Z') }
      ]);
    });
  });
});

function createChatLog(memberNumber: number, sessionId: string, chatRoom: string, timestamp: string): IChatLog {
  return {
    chatRoom,
    content: 'Hello',
    sender: { id: 99, name: 'Sender', color: '#fff' },
    session: { id: sessionId, name: 'Player', memberNumber },
    timestamp: new Date(timestamp),
    type: 'Chat'
  } as IChatLog;
}

function createMember(playerMemberNumber: number, memberNumber: number, fields: Partial<IMember>): IMember {
  return {
    playerMemberNumber,
    playerMemberName: 'Player',
    memberNumber,
    description: 'A long description that is not needed for the overview',
    ...fields
  };
}

/**
 * Creates the database with the schema of version 6 and the given chat logs,
 * then opens it with the current version to run the upgrade.
 */
async function createVersion6Database(chatLogs: IChatLog[]) {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('bclub-tools', 6);
    request.onupgradeneeded = () => {
      const db = request.result;
      const chatRoomLogs = db.createObjectStore('chatRoomLogs', { autoIncrement: true, keyPath: 'id' });
      chatRoomLogs.createIndex('senderMemberNumber_idx', ['session.memberNumber', 'sender.id', 'session.id', 'chatRoom']);
      chatRoomLogs.createIndex('sessionMemberNumber_idx', 'session.memberNumber');
      chatRoomLogs.createIndex('member_session_chatRoom_idx', ['chatRoom', 'session.id', 'session.memberNumber']);
      const members = db.createObjectStore('members', { keyPath: ['playerMemberNumber', 'memberNumber'] });
      members.createIndex('memberName_idx', ['playerMemberNumber', 'memberName']);
      db.createObjectStore('appearances', { keyPath: ['contextMemberNumber', 'memberNumber'] });
      const beepMessages = db.createObjectStore('beepMessages', { autoIncrement: true, keyPath: 'id' });
      beepMessages.createIndex('context_member_idx', ['contextMemberNumber', 'memberNumber']);
      chatLogs.forEach(chatLog => chatRoomLogs.add(chatLog));
    };
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });

  (await openDatabase()).close();
}

async function writeChatLogs(chatLogs: IChatLog[]) {
  const transaction = await startTransaction(['chatRoomLogs', 'chatSessions'], 'readwrite');
  chatLogs.forEach(chatLog => transaction.objectStore('chatRoomLogs').add(chatLog));
  await recordChatSessions(transaction, chatLogs);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  transaction.db.close();
}

function deleteDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('bclub-tools');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion blocked by an open connection'));
  });
}

async function putAll(store: 'members', values: object[]) {
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

async function getAll<T>(store: 'chatSessions') {
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
