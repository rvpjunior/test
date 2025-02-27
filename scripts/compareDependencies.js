const fs = require("fs");

const mainDepsFile = "dependencies-main.json";
const prDepsFile = "dependencies-pr.json";
const outputFile = "dependencies-comment.txt";

// Load dependency trees
const loadDeps = (file) => {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf-8")).dependencies || {};
};

// Extract dependencies (up to 2 levels) and exclude deduplicated ones
const extractDeps = (deps) => {
  const result = {};
  const traverse = (pkg, path = []) => {
    if (!pkg || pkg.resolved) return; // Ignore deduplicated dependencies

    const pkgPath = path.join(" > ");
    result[pkgPath] = pkg.version || "unknown";

    if (pkg.dependencies) {
      Object.entries(pkg.dependencies).forEach(([subPkg, subPkgData]) => {
        traverse(subPkgData, [...path, subPkg]);
      });
    }
  };

  Object.entries(deps).forEach(([pkg, pkgData]) => {
    traverse(pkgData, [pkg]);
  });

  return result;
};

const mainDeps = extractDeps(loadDeps(mainDepsFile));
const prDeps = extractDeps(loadDeps(prDepsFile));

// Compare dependencies
let report = "### 📦 Dependency Changes (Up to 2 Levels, Excluding Deduplicated)\n\n";
report += "**🔍 Analyzing dependency changes...**\n\n";
report += "| Dependency | Change |\n";
report += "|------------|--------|\n";

const allDeps = new Set([...Object.keys(mainDeps), ...Object.keys(prDeps)]);
allDeps.forEach((dep) => {
  const mainVersion = mainDeps[dep] || "🚫 Not present";
  const prVersion = prDeps[dep] || "🚫 Removed";

  if (mainVersion !== prVersion) {
    report += `| ${dep} | 🔄 ${mainVersion} → ${prVersion} |\n`;
  }
});

fs.writeFileSync(outputFile, report);
console.log("✅ Dependency comparison written to", outputFile);
