import { determineMemberType } from './member';
import { MemberType } from '../../../models';

describe('determineMemberType', () => {
  ([
    ['', 'Member'],
    ['', 'Friend'],
    ['', 'Submissive'],
    ['', 'Lover'],
    ['', 'Owner'],
    ['Member', 'Friend'],
    ['Member', 'Submissive'],
    ['Member', 'Lover'],
    ['Member', 'Owner'],
    ['Friend', 'Submissive'],
    ['Friend', 'Lover'],
    ['Friend', 'Owner'],
    ['Submissive', 'Lover'],
    ['Submissive', 'Owner'],
    ['Lover', 'Owner'],
  ] as [MemberType, MemberType][]).forEach(test => {
    it(`should allow type '${test[0]}' to change to '${test[1]}'`, () => {
      const result = determineMemberType(test[0], test[1]);
      expect(result).toBe(test[1]);
    });
  });

  ([
    ['Member', ''],
    ['Friend', ''],
    ['Friend', 'Member'],
    ['Submissive', ''],
    ['Submissive', 'Member'],
    ['Submissive', 'Friend'],
    ['Lover', ''],
    ['Lover', 'Member'],
    ['Lover', 'Friend'],
    ['Lover', 'Submissive'],
    ['Owner', ''],
    ['Owner', 'Member'],
    ['Owner', 'Friend'],
    ['Owner', 'Submissive'],
    ['Owner', 'Lover'],
  ] as [MemberType, MemberType][]).forEach(test => {
    it(`should disallow type '${test[0]}' to change to '${test[1]}'`, () => {
      const result = determineMemberType(test[0], test[1]);
      expect(result).toBe(test[0]);
    });
  });

  ([
    ['', 'Member', ['Friend', 'Submissive']],
    ['Submissive', 'Friend', ['Friend', 'Submissive']],
    ['Friend', 'Submissive', ['Friend', 'Submissive']],
  ] as [MemberType, MemberType, MemberType[]][]).forEach(test => {
    it(`should allow type '${test[0]}' to change to '${test[1]}' with exceptions '${test[2].join(',')}'`, () => {
      const result = determineMemberType(test[0], test[1], test[2]);
      expect(result).toBe(test[1]);
    });
  });

  ([
    ['Lover', 'Submissive', ['Friend', 'Submissive']],
    ['Owner', 'Friend', ['Friend', 'Submissive']],
  ] as [MemberType, MemberType, MemberType[]][]).forEach(test => {
    it(`should disallow type '${test[0]}' to change to '${test[1]}' with exceptions '${test[2].join(',')}'`, () => {
      const result = determineMemberType(test[0], test[1], test[2]);
      expect(result).toBe(test[0]);
    });
  });
});
