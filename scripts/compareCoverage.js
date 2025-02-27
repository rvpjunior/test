const fs = require("fs");
const cheerio = require('cheerio');

const coverageMainFile = "coverage-main.html";
const coveragePrFile = "coverage-pr.html";
const outputFile = "coverage-comment.txt";

if (!fs.existsSync(coverageMainFile) || !fs.existsSync(coveragePrFile)) {
  console.error("❌ Coverage files not found.");
  process.exit(1);
}

const parseHtml = (filePath) => {
  const htmlFile = fs.readFileSync(filePath, 'utf8');
  const $ = cheerio.load(htmlFile);
  const coverageMap = new Map();

  $('table tbody tr').each((_, row) => {
    const cols = $(row).find('td, th').map((_, col) => $(col).text().trim()).get();
    
    if (cols.length >= 5) {
        const file = cols[0];
        const stmtPct = cols[2];
        const branchPct = cols[4];

        coverageMap.set(file, {
          statementCoverage: parseFloat(stmtPct),
          branchCoverage: parseFloat(branchPct),
        });
    }})
  

  return coverageMap;
};

const mainCoverage = parseHtml(coverageMainFile);
const prCoverage = parseHtml(coveragePrFile);

let report = "### 📊 Code Coverage Comparison\n\n";
report += "**🔍 Analyzing coverage changes...**\n\n";
report += "| File | Line Coverage Change | Branch Coverage Change |\n";
report += "|------|----------------------|-----------------------|\n";

let downgradeDetected = false;

prCoverage.forEach((prCov, file) => {
  const mainCov = mainCoverage.get(file) || {
    statementCoverage: 100,
    branchCoverage: 0,
  };
  const lineChange = prCov.statementCoverage - mainCov.statementCoverage;
  const branchChange = prCov.branchCoverage - mainCov.branchCoverage;

  if (lineChange < 0 && branchChange < 0) {
    report += `| ${file} | 🔴 ${lineChange.toFixed(
      2
    )}% | 🔴 ${branchChange.toFixed(2)}% |\n`;
    downgradeDetected = true;
  } else if (lineChange < 0) {
    report += `| ${file} | 🔴 ${lineChange.toFixed(2)}% | N/A |\n`;
    downgradeDetected = true;
  } else if (branchChange < 0) {
    report += `| ${file} | N/A | 🔴 ${branchChange.toFixed(2)}% |\n`;
    downgradeDetected = true;
  }
});

if (!downgradeDetected) {
  report += "| No downgrade of coverage detected | ✅ | ✅ |\n";
}

fs.writeFileSync(outputFile, report);
console.log("✅ Coverage comparison written to", outputFile);