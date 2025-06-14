const { sequelize } = require('./db/connect');
const config = require('./config');
const { Umzug, SequelizeStorage } = require('umzug');

// Configure Umzug to handle migrations
const umzug = new Umzug({
  migrations: { 
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context.queryInterface, context.Sequelize),
        down: async () => migration.down(context.queryInterface, context.Sequelize),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Function to run migrations
async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connection established');
    
    // Run pending migrations
    const migrations = await umzug.up();
    
    if (migrations.length === 0) {
      console.log('No pending migrations to run');
    } else {
      console.log(`Executed ${migrations.length} migrations:`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    }
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 