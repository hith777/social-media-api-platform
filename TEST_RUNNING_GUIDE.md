# Test Running Guide

## Problem
When running all tests together (`npm test`), tests fail due to interference between test suites. This is caused by:
- Parallel test execution causing race conditions
- Shared database state
- Cached data not being cleared between tests

## Solution
Run tests individually or sequentially to avoid interference.

## Available Test Scripts

### Run Individual Phase Tests
```bash
npm run test:phase1    # Run phase1.test.ts only
npm run test:phase2    # Run phase2.test.ts only
npm run test:phase3    # Run phase3.test.ts only
npm run test:phase4    # Run phase4.test.ts only
npm run test:phase5    # Run phase5.test.ts only
npm run test:phase6    # Run phase6.test.ts only
npm run test:phase7    # Run phase7.test.ts only
```

### Run All Phase Tests Together
```bash
npm run test:phases    # Run all phase*.test.ts files
```

### Run Tests by Category
```bash
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run e2e tests only
```

### Run Tests Sequentially (One at a Time)
```bash
npm run test:sequential    # Run all tests one at a time (no parallel execution)
```

### Run All Tests (Current Behavior)
```bash
npm test                   # Run all tests (now runs sequentially by default in local dev)
```

## Recommended Approach

1. **During Development**: Run individual tests
   ```bash
   npm run test:phase1
   npm run test:phase2
   # etc.
   ```

2. **Before Committing**: Run all phase tests sequentially
   ```bash
   npm run test:phases
   ```

3. **Full Test Suite**: Run all tests sequentially
   ```bash
   npm run test:sequential
   ```

## Identifying Failing Tests

To see which specific tests are failing when running all together:

```bash
# Run with verbose output to see test names
npm test -- --verbose

# Run a specific test file
npm test -- tests/phase4.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create a post"
```

## Common Issues

1. **Cache Issues**: If tests fail due to cached data, clear Redis cache:
   ```bash
   redis-cli FLUSHALL
   ```

2. **Database State**: If tests fail due to database state, ensure proper cleanup in `beforeAll`/`afterAll` hooks

3. **Parallel Execution**: If tests still interfere, use `--runInBand` flag:
   ```bash
   npm test -- --runInBand
   ```

