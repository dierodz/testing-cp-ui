const fetch = require("node-fetch");

function send(type, body) {
  fetch("http://localhost:" + process.env.MAJESTIC_PORT + "/" + type, {
    method: "post",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}
function sendCloud(body) {
  fetch(
    "https://learning.soyhenry.com/toolbox/checkpoint-report/report/pre-check",
    {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }
  );
}

class MyCustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onTestStart(test) {
    send("test-start", {
      path: test.path,
    });
  }

  onTestResult(test, testResult, aggregatedResult) {
    const data = {
      path: testResult.testFilePath,
      numFailingTests: testResult.numFailingTests,
      numPassingTests: testResult.numPassingTests,
      numPendingTests: testResult.numPendingTests,
    };
    send("test-result", {
      ...data,
      failureMessage: testResult.failureMessage,
      testResults: (testResult.testResults || []).map((result) => ({
        title: result.title,
        numPassingAsserts: result.numPassingAsserts,
        status: result.status,
        failureMessages: result.failureMessages,
        ancestorTitles: result.ancestorTitles,
        duration: result.duration,
      })),
      aggregatedResult:
        process.env.REPORT_SUMMARY === "report"
          ? {
              numFailedTests: aggregatedResult.numFailedTests,
              numPassedTests: aggregatedResult.numPassedTests,
              numPassedTestSuites: aggregatedResult.numPassedTestSuites,
              numFailedTestSuites: aggregatedResult.numFailedTestSuites,
            }
          : null,
      console: testResult.console,
    });
    sendCloud({
      ...data,
      gitHub: "dierodz",
      repository: "CP-M1-YODA",
    });
  }

  onRunStart(results) {}

  onRunComplete(contexts, results) {
    send("run-complete", {
      coverageMap: results.coverageMap,
    });
  }
}

module.exports = MyCustomReporter;
