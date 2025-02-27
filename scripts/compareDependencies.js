const fs = require("fs");

const mainDepsFile = "dependencies-main.json";
const prDepsFile = "dependencies-pr.json";
const outputFile = "dependencies-comment.txt";

// Load dependency trees
const loadDeps = (file) => {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8")).dependencies || {};
};

// Extract dependencies (up to 2 levels)
const extractDeps = (deps) => {
  const result = {};
  Object.keys(deps).forEach((pkg) => {
    result[pkg] = deps[pkg].version || "unknown";
    if (deps[pkg].dependencies) {
      Object.keys(deps[pkg].dependencies).forEach((subPkg) => {
        result[`${pkg} > ${subPkg}`] =
          deps[pkg].dependencies[subPkg].version || "unknown";
      });
    }
  });
  return result;
};

const mainDeps = extractDeps(loadDeps(mainDepsFile));
const prDeps = extractDeps(loadDeps(prDepsFile));

// Compare dependencies
let report = "### 📦 Dependency Changes (Up to 2 Levels)\n\n";
report += "**🔍 Analyzing dependency changes...**\n\n";
report += "| Dependency | Change |\n";
report += "|------------|--------|\n";

const allDeps = new Set([...Object.keys(mainDeps), ...Object.keys(prDeps)]);
let changesFound = false;

allDeps.forEach((dep) => {
  let mainVersion;
  let prVersion;
  if (dep.includes(" > ")) {
    const [_, subPkg] = dep.split(" > ");
    mainVersion = mainDeps[subPkg] || mainDeps[dep] || "🚫 Not present";
    prVersion = prDeps[subPkg] || prDeps[dep] || "🚫 Removed";
  } else {
    mainVersion = mainDeps[dep] || "🚫 Not present";
    prVersion = prDeps[dep] || "🚫 Removed";
  }

  if (mainVersion !== prVersion) {
    changesFound = true;
    report += `| ${dep} | 🔄 ${mainVersion} → ${prVersion} |\n`;
  }
});

if (!changesFound) {
  report += "| No changes detected | ✅ |\n";
}

fs.writeFileSync(outputFile, report);
console.log("✅ Dependency comparison written to", outputFile);
