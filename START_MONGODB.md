# How to Start MongoDB

## Quick Start
```bash
mongod --config /opt/homebrew/etc/mongod.conf --fork
```

## Check if MongoDB is Running
```bash
# Check process
ps aux | grep mongod | grep -v grep

# Check version
mongosh --eval "db.version()"

# Check port
lsof -i :27017
```

## Alternative Methods

### Method 1: Using Homebrew Services (if service works)
```bash
brew services start mongodb-community@7.0
```

### Method 2: Manual Start with Custom DB Path
```bash
mkdir -p ~/data/db
mongod --dbpath ~/data/db --fork --logpath ~/data/db/mongod.log
```

### Method 3: Start Without Forking (see errors)
```bash
mongod --config /opt/homebrew/etc/mongod.conf
```

## Stop MongoDB
```bash
# Find process
ps aux | grep mongod | grep -v grep

# Kill process (replace PID with actual process ID)
kill <PID>

# Or using pkill
pkill mongod
```

## Connection String
Default: `mongodb://localhost:27017/momosewa`

## Troubleshooting

### If MongoDB won't start:
1. Check if port 27017 is already in use: `lsof -i :27017`
2. Check MongoDB logs: `tail -f ~/data/db/mongod.log`
3. Check permissions on data directory
4. Try starting without `--fork` to see error messages

### If connection still fails:
1. Verify MongoDB is listening: `lsof -i :27017`
2. Check firewall settings
3. Verify MONGO_URI in `.env` file matches: `mongodb://localhost:27017/momosewa`
