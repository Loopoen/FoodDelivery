import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './users.js'

export const voucherTypeEnum = pgEnum('voucher_type', [
  'PERCENTAGE',
  'FIXED_AMOUNT',
])

export const vouchers = pgTable('vouchers', {
  id: uuid('id').primaryKey().defaultRandom(),

  code: text('code')
    .notNull()
    .unique(),

  description: text('description'),

  type: voucherTypeEnum('type')
    .notNull(),

  value: numeric('value', {
    precision: 10,
    scale: 2,
  }).notNull(),

  minOrderAmount: numeric('min_order_amount', {
    precision: 10,
    scale: 2,
  }).default('0').notNull(),

  maxDiscountAmount: numeric('max_discount_amount', {
    precision: 10,
    scale: 2,
  }),

  usageLimit: integer('usage_limit'),

  usedCount: integer('used_count')
    .default(0)
    .notNull(),

  startAt: timestamp('start_at')
    .notNull(),

  expiresAt: timestamp('expires_at')
    .notNull(),

  isActive: boolean('is_active')
    .default(true)
    .notNull(),

  createdAt: timestamp('created_at')
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull(),
})

export const voucherUsages = pgTable('voucher_usages', {
  id: uuid('id').primaryKey().defaultRandom(),

  voucherId: uuid('voucher_id')
    .notNull()
    .references(() => vouchers.id, {
      onDelete: 'cascade',
    }),

  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, {
      onDelete: 'cascade',
    }),

  orderId: uuid('order_id')
    .notNull()
    .unique(),

  discountAmount: numeric('discount_amount', {
    precision: 10,
    scale: 2,
  }).notNull(),

  usedAt: timestamp('used_at')
    .defaultNow()
    .notNull(),
})

export type Voucher = typeof vouchers.$inferSelect
export type NewVoucher = typeof vouchers.$inferInsert

export type VoucherUsage = typeof voucherUsages.$inferSelect
export type NewVoucherUsage = typeof voucherUsages.$inferInsert