import * as SQLite from 'expo-sqlite';

async function cleanupDatabase() {
  const db = await SQLite.openDatabaseAsync('db'); // Replace 'databaseName' with your actual database name

  try {
    // Fetch all table names except SQLite's internal tables
    const tablesResult = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );

    const tableNames = tablesResult.map((row:any) => row.name);

    if (tableNames.length === 0) {
      console.log('✅ No tables found to drop.');
      return;
    }

    // Begin a transaction to drop all tables
    await db.execAsync('BEGIN TRANSACTION;');

    for (const tableName of tableNames) {
      await db.execAsync(`DROP TABLE IF EXISTS ${tableName};`);
      console.log(`🗑️ Dropped table: ${tableName}`);
    }

    // Commit the transaction
    await db.execAsync('COMMIT;');

    console.log('✅ Database cleanup complete.');
  } catch (error) {
    // Rollback the transaction in case of an error
    await db.execAsync('ROLLBACK;');
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupDatabase();
