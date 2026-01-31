import {
  listMatchesQuerySchema,
  MATCH_STATUS,
  matchIdParamSchema,
  createMatchSchema,
  updateScoreSchema,
} from './matches.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (e) {
    console.error(`❌ ${name}`);
    console.error(e.errors || e.message || e);
  }
}

// listMatchesQuerySchema tests

test('listMatchesQuerySchema: valid limit', () => {
  listMatchesQuerySchema.parse({ limit: '10' });
});

test('listMatchesQuerySchema: limit over max', () => {
  try {
    listMatchesQuerySchema.parse({ limit: 101 });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

test('listMatchesQuerySchema: no limit', () => {
  listMatchesQuerySchema.parse({});
});

// matchIdParamSchema tests

test('matchIdParamSchema: valid id', () => {
  matchIdParamSchema.parse({ id: '5' });
});

test('matchIdParamSchema: invalid id', () => {
  try {
    matchIdParamSchema.parse({ id: 0 });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

// createMatchSchema tests
const validMatch = {
  sport: 'football',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  startTime: '2024-01-01T12:00:00.000Z',
  endTime: '2024-01-01T14:00:00.000Z',
};

test('createMatchSchema: valid', () => {
  createMatchSchema.parse(validMatch);
});

test('createMatchSchema: invalid ISO date', () => {
  try {
    createMatchSchema.parse({ ...validMatch, startTime: 'not-a-date' });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

test('createMatchSchema: endTime before startTime', () => {
  try {
    createMatchSchema.parse({ ...validMatch, endTime: '2024-01-01T10:00:00.000Z' });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

test('createMatchSchema: with scores', () => {
  createMatchSchema.parse({ ...validMatch, homeScore: '2', awayScore: 1 });
});

test('createMatchSchema: negative score', () => {
  try {
    createMatchSchema.parse({ ...validMatch, homeScore: -1 });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

// updateScoreSchema tests

test('updateScoreSchema: valid', () => {
  updateScoreSchema.parse({ homeScore: '3', awayScore: 2 });
});

test('updateScoreSchema: negative', () => {
  try {
    updateScoreSchema.parse({ homeScore: -1, awayScore: 0 });
    throw new Error('Should fail');
  } catch (e) {
    if (!e.errors) throw e;
  }
});

console.log('MATCH_STATUS:', MATCH_STATUS);
