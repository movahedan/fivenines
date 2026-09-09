#!/usr/bin/env bun

/**
 * Test by Folder - Debugging Tool for Test Isolation Issues
 *
 * This script runs tests in isolation by folder to help identify cross-test interference.
 * It was instrumental in debugging the Bun test isolation bug where tests would pass
 * individually but fail when run together due to global mock state interference.
 *
 * Usage:
 *   bun run test-by-folder.ts [path]
 *   bun run test-by-folder.ts src/entities/
 *   bun run test-by-folder.ts packages/intershell/src/entities/
 *
 * This tool helped identify that the issue was with global mock state persistence
 * between test files, leading to the solution of migrating to function-level mocking
 * with proper cleanup patterns.
 */

import { $ } from "bun";

interface TestResult {
	folder: string;
	success: boolean;
	output: string;
}

async function runTestsByFolder(testPath = "src/") {
	console.log(`🔍 Running tests by folder to check for isolation issues in ${testPath}...\n`);

	// Default test folders for intershell package
	const defaultTestFolders = [
		"src/entities/affected/",
		"src/entities/branch/",
		"src/entities/compose/",
		"src/entities/config/",
		"src/entities/commit/",
		"src/entities/packages/",
		"src/entities/tag/",
		"src/entities/version/",
		"src/entities/entities.shell.test.ts",
	];

	// If a specific path is provided, try to discover test files
	let testFolders: string[] = defaultTestFolders;

	if (testPath !== "src/") {
		try {
			// Try to find test files in the provided path
			const result =
				await $`find ${testPath} -name "*.test.ts" -o -name "*.test.js" | head -20`.quiet();
			if (result.exitCode === 0 && result.stdout.toString().trim()) {
				const discoveredTests = result.stdout.toString().trim().split("\n");
				testFolders = discoveredTests;
			} else {
				// Fallback to the provided path
				testFolders = [testPath];
			}
		} catch {
			console.log(`⚠️  Could not discover test files in ${testPath}, using as single test path`);
			testFolders = [testPath];
		}
	}

	const results: TestResult[] = [];

	for (const folder of testFolders) {
		console.log(`📁 Testing ${folder}...`);

		try {
			const result = await $`bun test ${folder}`.quiet();
			results.push({
				folder,
				success: result.exitCode === 0,
				output: result.stdout.toString(),
			});

			if (result.exitCode === 0) {
				console.log(`✅ ${folder} - PASSED`);
			} else {
				console.log(`❌ ${folder} - FAILED`);
				console.log(result.stderr.toString());
			}
		} catch (error) {
			results.push({
				folder,
				success: false,
				output: error instanceof Error ? error.message : String(error),
			});
			console.log(`❌ ${folder} - ERROR: ${error}`);
		}

		console.log(""); // Empty line for readability
	}

	// Summary
	console.log("📊 SUMMARY:");
	console.log("=".repeat(50));

	const passed = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`📁 Total: ${results.length}`);

	if (failed > 0) {
		console.log("\n❌ Failed folders:");
		results
			.filter((r) => !r.success)
			.forEach((r) => {
				console.log(`  - ${r.folder}`);
			});
	}

	console.log("\n💡 If individual folders pass but 'bun test' fails,");
	console.log("   this indicates cross-test interference (global mock state issues).");
	console.log("   See tools/tests-preset/AGENTS.md for current test guidance.");

	process.exit(failed > 0 ? 1 : 0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const testPath = args[0] || "src/";

// Run the tests
runTestsByFolder(testPath).catch(console.error);
