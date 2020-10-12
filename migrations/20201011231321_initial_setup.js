exports.up = (knex) => {
    return Promise.all([
        knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'),
        knex.schema.createTable('accounts', (table) => {
            table.timestamps();
            table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
            table.string('email').notNullable().unique();
            table.string('password').notNullable();
            table.string('mfa_secret');
            table.boolean('mfa_verified').notNullable().defaultTo(false);
        })
    ]);
};

exports.down = (knex) => {
    return knex.schema.dropTable('accounts');
};