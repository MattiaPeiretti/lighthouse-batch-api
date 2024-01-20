"use strict";
require("shelljs/global");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const OUT = "./report/lighthouse";
const REPORT_SUMMARY = "summary.json";
const JSON_EXT = ".report.json";
const CSV_EXT = ".report.csv";
const HTML_EXT = ".report.html";

execute.OUT = OUT;
module.exports = execute;

function generateWebsiteReport(lhScript, isDesktop) {

  let preset = ""

  if (isDesktop) {
    preset = "--preset desktop"
  }

  function generateWebsiteReportInternal(site, count) {

    const prefix = `${count + 1}/${count}: `;

    const cmd = `"${site.url}" ${preset} --output json --output-path stdout --chrome-flags="--no-sandbox --headless --disable-gpu"`;

    log(`${prefix}Lighthouse analyzing '${site.url}'`);
    log(cmd);

    const outcome = exec(`${lhScript} ${cmd}`);
    const summary = updateSummary(site, outcome);

    if (summary.error)
      console.warn(`${prefix}Lighthouse analysis FAILED for ${summary.url}`);
    else
      log(
          `${prefix}Lighthouse analysis of '${summary.url}' complete with score ${summary.score}`
      );

    return summary;
  }

  return generateWebsiteReportInternal

}
function execute(options, isDesktop) {
  log = log.bind(log, options.verbose || false);

  const lhScript = lighthouseScript(options, log);

  const reports = sitesInfo(options)
    .map(generateWebsiteReport(lhScript, isDesktop))
    .filter((summary) => !!summary);

  console.log(`Lighthouse batch run end`);

  return reports;
}

function sitesInfo(options) {
  let sites = options.sites;

  const existingNames = {};

  return sites.map((url) => {
    url = url.trim();

    if (!url.match(/^https?:/)) {
      if (!url.startsWith("//")) url = `//${url}`;
      url = `https:${url}`;
    }

    const origName = siteName(url);

    let name = origName;

    // if the same page is being tested multiple times then
    // give each one an incremented name to avoid collisions
    let j = 1;
    while (existingNames[name]) {
      name = `${origName}_${j}`;
      j++;
    }
    existingNames[name] = true;

    const info = {
      url,
      name,
    };
    if (options.html) info.html = `${name}${HTML_EXT}`;
    if (options.csv) info.csv = `${name}${CSV_EXT}`;
    return info;
  });
}

function lighthouseScript(options, log) {
  if (options.useGlobal) {
    if (exec("lighthouse --version").code === 0) {
      log("Targeting global install of Lighthouse cli");
      return "lighthouse";
    } else {
      console.warn(
        "Global Lighthouse install not found, falling back to local one"
      );
    }
  }
  let cliPath = path.resolve(
    `${__dirname}/node_modules/lighthouse/cli/index.js`
  );
  if (!fs.existsSync(cliPath)) {
    cliPath = path.resolve(
      `${__dirname}/../lighthouse/cli/index.js`
    );
    if (!fs.existsSync(cliPath)) {
      console.error(`Failed to find Lighthouse CLI, aborting.`);
      process.exit(1);
    }
  }
  log(`Targeting local Lighthouse cli at '${cliPath}'`);
  return `node ${cliPath}`;
}

function siteName(site) {
  const maxLength = 100;
  let name = site
    .replace(/^https?:\/\//, "")
    .replace(/[\/\?#:\*\$@\!\.]/g, "_");

  if (name.length > maxLength) {
    const hash = crypto
      .createHash("sha1")
      .update(name)
      .digest("hex")
      .slice(0, 7);

    name = name.slice(0, maxLength).replace(/_+$/g, ""); // trim any `_` suffix
    name = `${name}_${hash}`;
  }
  return name;
}

function updateSummary(summary, outcome) {
  if (outcome.code !== 0) {
    summary.score = 0;
    summary.error = outcome.stderr;
    return summary;
  }
  const report = JSON.parse(outcome.stdout);
  return {
    ...summary,
    ...getAverageScore(report),
  };
}

function getAverageScore(report) {
  let categories = report.reportCategories; // lighthouse v1,2
  if (report.categories) {
    // lighthouse v3
    categories = Object.values(report.categories);
  }
  let total = 0;
  const detail = categories.reduce((acc, cat) => {
    if (cat.id) acc[cat.id] = cat.score;
    total += cat.score;
    return acc;
  }, {});
  return {
    score: Number((total / categories.length).toFixed(2)),
    detail,
  };
}

function checkBudgets(summary, options) {
  const errors = [];
  if (options.score > 0) {
    const score = toScore(summary.score);
    if (score < options.score) {
      errors.push(
        `average score ${score} < ${options.score} for ${summary.url}`
      );
    }
  }

  if (options.accessibility > 0 && summary.detail) {
    const score = toScore(summary.detail.accessibility);
    if (score < options.accessibility) {
      errors.push(
        `accessibility score ${score} < ${options.accessibility} for ${summary.url}`
      );
    }
  }

  if (options.performance > 0 && summary.detail) {
    const score = toScore(summary.detail.performance);
    if (score < options.performance) {
      errors.push(
        `performance score ${score} < ${options.performance} for ${summary.url}`
      );
    }
  }

  if (options.bestPractices > 0 && summary.detail) {
    const score = toScore(summary.detail["best-practices"]);
    if (score < options.bestPractices) {
      errors.push(
        `best practices score ${score} < ${options.bestPractices} for ${summary.url}`
      );
    }
  }

  if (options.seo > 0 && summary.detail) {
    const score = toScore(summary.detail.seo);
    if (score < options.seo) {
      errors.push(
        `seo score ${score} < ${options.seo} for site ${summary.url}`
      );
    }
  }

  if (options.pwa > 0 && summary.detail) {
    const score = toScore(summary.detail.pwa);
    if (score < options.pwa) {
      errors.push(
        `pwa score ${score} < ${options.pwa} for site ${summary.url}`
      );
    }
  }

  return errors.length ? errors : undefined;
}

function log(v, msg) {
  if (v) console.log(msg);
}

function toScore(score) {
  return Number(score) * 100;
}
