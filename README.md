# Blooprint backend

This is the Blooprint API server.


## Getting started

You need to have node.js installed. This app was built and tested using v23. It likely works with other versions, but that hasn't been tested.

Get started by doing:
```
git clone https://github.com/verespej/blueprint-project-backend.git
cd blueprint-project-backend
npm install

# Set up DB
npm run db:migrate:local
npm run db:seed:local

# Run the server
npm run dev
```

You should see the following once the server starts:
```
Server running on http://localhost:3000
```

You can now send the server requests:
```
curl -s http://localhost:3000/v1/assessments | jq
```

For the request above, if everything's working, you'll receive back a list of available assessments.

Example curl commands are included in comments with all API endpoints. See `src/api/...`.


## Configuration

Server configuration is done with `dotenv`. The default configuration is in file `.env`.

Environment-specific config files can be created to override the defaults.

The name of the current environment is determined by checking the `NODE_ENV` environmnet variable.

Environment-specific config files are loaded by matching the environment name to the config file name. For example, if `NODE_ENV` is set to `production`, the system will load configs from `.env.production`, if available. These configs will override those in `.env`.


## Tests

To run tests, you'll first need to create a config file called `.env.test`. It should contain:
```
DB_URL=:memory:
```

Now, simply run:
```
npm run test
```


## DB

The DB currently used is SQLite3.

If you want to reinit the data in the DB, stop the server and do:
```
npm run db:destroy:local
npm run db:migrate:local
npm run db:seed:local
```

This:
1. Destroys the DB
2. Recreates the DB and runs schema migrations
3. Adds seed data to the DB

You can now restart the server.

If you want to update the DB schema, make your edits in `db/schema`, then:
```
npm run typecheck
npm run db:generate -- --name=migration-name
npm run db:migrate:local
```
(Replace `migration-name` with whatever you want to name the migration.)


## Blueprint exercise

See [BLUEPRINT.md](./BLUEPRINT.md).
