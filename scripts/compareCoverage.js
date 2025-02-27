const fs = require("fs");
const path = require("path");

const coverageMainFile = "coverage-main.lcov";
const coveragePrFile = "coverage-pr.lcov";
const outputFile = "coverage-comment.txt";

// Ensure files exist
if (!fs.existsSync(coverageMainFile) || !fs.existsSync(coveragePrFile)) {
  console.error("❌ Coverage files not found.");
  process.exit(1);
}

// Parse LCOV files
const parseLcov = (filePath) => {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  const coverageMap = new Map();

  let currentFile = null;
  for (const line of lines) {
    if (line.startsWith("SF:")) {
      currentFile = path.basename(line.slice(3)); // Extract filename
    } else if (line.startsWith("LF:") && currentFile) {
      const totalLines = parseInt(line.split(":")[1], 10);
      const hitLines = parseInt(lines.find(l => l.startsWith("LH:")).split(":")[1], 10);
      const coverage = ((hitLines / totalLines) * 100).toFixed(2);
      coverageMap.set(currentFile, parseFloat(coverage));
    }
  }
  return coverageMap;
};

const mainCoverage = parseLcov(coverageMainFile);
const prCoverage = parseLcov(coveragePrFile);

let report = "### 📊 Code Coverage Comparison\n\n";
report += "**🔍 Analyzing coverage changes...**\n\n";
report += "| File | Coverage Change |\n";
report += "|------|----------------|\n";

let downgradeDetected = false;

prCoverage.forEach((prCov, file) => {
  const mainCov = mainCoverage.get(file) || 0;
  const change = prCov - mainCov;

  if (change < 0) {
    report += `| ${file} | 🔴 ${change.toFixed(2)}% |\n`;
    downgradeDetected = true;
  }
});

if (!downgradeDetected) {
  report += "| No downgrade of coverage detected | ✅ |\n";
}

fs.writeFileSync(outputFile, report);
console.log("✅ Coverage comparison written to", outputFile);
