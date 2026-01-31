
import { pgTable, serial, text, integer, timestamp, pgEnum, jsonb, varchar } from 'drizzle-orm/pg-core';

// Enum for match status
export const matchStatusEnum = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// Matches table
export const matches = pgTable('matches', {
	id: serial('id').primaryKey(),
	sport: text('sport').notNull(),
	homeTeam: text('home_team').notNull(),
	awayTeam: text('away_team').notNull(),
	status: matchStatusEnum('status').notNull().default('scheduled'),
	startTime: timestamp('start_time', { withTimezone: true }).notNull(),
	endTime: timestamp('end_time', { withTimezone: true }),
	homeScore: integer('home_score').notNull().default(0),
	awayScore: integer('away_score').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Commentary table
export const commentary = pgTable('commentary', {
	id: serial('id').primaryKey(),
	matchId: integer('match_id').notNull().references(() => matches.id),
	minute: integer('minute').notNull(),
	sequence: integer('sequence').notNull(),
	period: varchar('period', { length: 32 }).notNull(),
	eventType: varchar('event_type', { length: 64 }).notNull(),
	actor: text('actor'),
	team: text('team'),
	message: text('message'),
	metadata: jsonb('metadata'),
	tags: text('tags'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

