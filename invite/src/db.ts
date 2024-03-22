/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import dotenv from 'dotenv';
dotenv.config();

import knex, {type Knex} from 'knex';

/** Connect to a database instance. */
export function dbConnect(): Knex {
  return knex({
    client: 'pg',
    connection: {
      host: process.env.DB_UNIX_SOCKET,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    useNullAsDefault: true,
  } as Knex.Config);
}

/** Set up the database table. */
export async function setupDb(db: Knex): Promise<void> {
  return db.schema.createTable('invites', table => {
    table.increments('id').primary();
    table.string('username', 40);
    table.string('repo', 100);
    table.integer('issue_number');
    table.string('action');
    table.boolean('archived').defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(db.fn.now());
  });
}
