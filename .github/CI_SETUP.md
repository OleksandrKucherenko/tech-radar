# CI/CD Setup Guide

This document explains the Continuous Integration setup for the Tech Radar project.

## Overview

The project uses GitHub Actions for CI/CD with the following workflows:

1. **Tests** (`.github/workflows/test.yml`) - Runs unit tests with code coverage on every PR
2. **Deploy to Pages** (`.github/workflows/deploy-pages.yml`) - Deploys main site to GitHub Pages
3. **PR Preview** (`.github/workflows/pr-preview.yml`) - Creates preview deployments for PRs

## Test Workflow

### Triggers
- Pull requests to `master` branch
- Pushes to `master` branch
- Manual workflow dispatch

### What It Does
1. Checks out the code
2. Sets up Bun runtime
3. Installs dependencies
4. Runs tests with coverage and JUnit reporting (`bun test --coverage --reporter=junit`)
5. Uploads code coverage to Codecov.io
6. Uploads test results to Codecov.io (JUnit XML format)
7. Codecov automatically comments on PRs with coverage diff and test results

### Coverage Reporting

Coverage is tracked using [Codecov.io](https://codecov.io), which provides:
- **Coverage badges** in README
- **PR comments** with coverage diff showing:
  - Overall project coverage change
  - Coverage on changed files (patch coverage)
  - Line-by-line coverage for modified files
- **Coverage trends** over time
- **GitHub Checks** integration

### Test Results Reporting

Test results are uploaded to Codecov in JUnit XML format, providing:
- **Test execution summary** (total tests, passed, failed)
- **Individual test results** for each test case
- **Test duration metrics**
- **Historical test trends** over time
- **Flaky test detection** (tests that sometimes fail)
- **Test performance tracking**

The JUnit reporter is built into Bun and configured via `bunfig.toml` or command-line flags.

## Setup Instructions

### 1. Codecov Token Setup

To enable coverage reporting, add the Codecov token as a GitHub secret:

1. Go to your repository settings on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CODECOV_TOKEN`
5. Value: `701ba8e4-75a9-45fc-a1eb-08bc3361c09a`
6. Click **Add secret**

### 2. Verify Workflow Permissions

Ensure the workflow has correct permissions:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests
3. Click **Save**

### 3. Enable Codecov Integration

The Codecov integration is configured via `codecov.yml` in the root directory.

Key settings:
- **Project coverage target**: 70%
- **Patch coverage target**: 70% (coverage on changed files)
- **Coverage threshold**: 2% (allowed drop before failing)
- **PR comments**: Enabled with diff and file coverage

## Configuration Files

### `.github/workflows/test.yml`
Main test workflow file that:
- Sets up Bun environment
- Runs tests with coverage and JUnit reporting
- Uploads coverage to Codecov
- Uploads test results to Codecov

### `codecov.yml`
Codecov configuration that controls:
- Coverage targets and thresholds
- PR comment format
- Ignored paths
- GitHub Checks integration

### `bunfig.toml`
Bun test runner configuration:
- Coverage directory: `./coverage`
- Coverage reporters: `lcov`, `text`
- Coverage threshold: 70%
- Skips test files from coverage
- JUnit reporter output: `./test-results.xml`

### `.gitignore`
Excludes test artifacts:
```
coverage/
*.lcov
test-results.xml
```

## Running Tests Locally

```bash
# Run tests without coverage
bun test

# Run tests with coverage
bun test --coverage

# Run tests with coverage and JUnit report
bun test --coverage --reporter=junit --reporter-outfile=./test-results.xml

# Or use the npm script
npm run test:junit

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test test/radar.test.js
```

## Test Reports

After running tests with coverage and JUnit reporting, you'll find:

### Coverage Reports
- **LCOV report**: `coverage/lcov.info` (uploaded to Codecov)
- **Text report**: Printed to console showing coverage percentages

### Test Results
- **JUnit XML**: `test-results.xml` (uploaded to Codecov)
- Contains test execution details, pass/fail status, and timing

## PR Comment Example

When a PR is created, Codecov will add a comment like:

```
## Codecov Report
Coverage: 85.23% (+2.15%)
Files changed: 1

| File | Coverage | Lines |
|------|----------|-------|
| docs/radar.js | 87.45% | 599 |

View full report at https://codecov.io/gh/...
```

## Troubleshooting

### Coverage Not Uploading
1. Check that `CODECOV_TOKEN` secret is set correctly
2. Verify workflow has write permissions
3. Check GitHub Actions logs for errors

### Tests Failing in CI but Passing Locally
1. Ensure all dependencies are in `package.json`
2. Check that you're using same Bun version
3. Look for environment-specific issues in logs

### Coverage Too Low
1. Check `bunfig.toml` threshold (default: 70%)
2. Add more test cases to `test/radar.test.js`
3. Review Codecov report to see uncovered lines

## Best Practices

1. **Always run tests locally** before pushing:
   ```bash
   bun test --coverage
   ```

2. **Maintain coverage** above 70%:
   - Add tests for new features
   - Test edge cases
   - Test error conditions

3. **Review coverage diffs** in PR comments:
   - Ensure new code is tested
   - Don't merge PRs that significantly drop coverage
   - Aim for >70% coverage on changed files

4. **Use coverage as a guide**, not a goal:
   - 100% coverage doesn't mean perfect tests
   - Focus on testing critical paths
   - Test behavior, not implementation

## Resources

- [Bun Test Runner Docs](https://bun.sh/docs/cli/test)
- [Codecov Documentation](https://docs.codecov.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Test Suite README](../test/README.md)
