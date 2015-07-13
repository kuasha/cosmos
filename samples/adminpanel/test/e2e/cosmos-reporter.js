/**
 * Created by maruf on 12/26/14.
 */

(function() {
    /**
     * This reporter is adapted from the console reporter of jasmine-reporter module
     * Basic reporter that outputs spec results to the browser console.
     * Useful if you need to test an html page and don't want the TrivialReporter
     * markup mucking things up.
     *
     * Usage:
     * var CosmosReporter = require('cosmos-reporter');
     * jasmine.getEnv().addReporter(new CosmosReporter());
     */

    var CosmosReporter = function() {
        this.started = false;
        this.finished = false;
    };

    CosmosReporter.prototype = {
        reportRunnerResults: function(runner) {
            var suites = runner.suites();
            for (var i = 0; i < suites.length; i++) {
                if (!suites[i].parentSuite) {
                    suiteResults(suites[i]);
                }
            }
            this.finished = true;
        },

        reportRunnerStarting: function(runner) {
            this.started = true;
            this.start_time = (new Date()).getTime();
            this.executed_specs = 0;
            this.passed_specs = 0;
            this.log("Runner Started.");
        },

        reportSpecResults: function(spec) {
            var resultText = "Failed.";

            if (spec.results().skipped) {
                resultText = 'Skipped.';
            } else if (spec.results().passed()) {
                this.passed_specs++;
                resultText = "Passed.";
            }

            this.log(resultText);
        },

        reportSpecStarting: function(spec) {
            this.executed_specs++;
            this.log(spec.suite.description + ' : ' + spec.description + ' ... ');
        },

        reportSuiteResults: function(suite) {
            var results = suite.results();
            this.log(suite.description + ": " + results.passedCount + " of " + results.totalCount + " passed.");
        },

        log: function(str) {
            console.log("####"+str);
        }
    };

    function suiteResults(suite) {

        var results = suite.results();
        startGroup(results, suite.description);
        var specs = suite.specs();
        for (var i in specs) {
            if (specs.hasOwnProperty(i)) {
                specResults(specs[i]);
            }
        }
        var suites = suite.suites();
        for (var j in suites) {
            if (suites.hasOwnProperty(j)) {
                suiteResults(suites[j]);
            }
        }
    }

    function specResults(spec) {
        var results = spec.results();
        startGroup(results, spec.description);
        var items = results.getItems();
        for (var k in items) {
            if (items.hasOwnProperty(k)) {
                itemResults(items[k]);
            }
        }
    }

    function itemResults(item) {
        if (item.passed && !item.passed()) {
            console.warn({actual:item.actual,expected: item.expected});
            item.trace.message = item.matcherName;
            console.error(item.trace);
        } else {
            console.info('Passed');
        }
    }

    function startGroup(results, description) {
        console.log(description + ' (' + results.passedCount + '/' + results.totalCount + ' passed, ' + results.failedCount + ' failures)');
    }

    // export public
    module.exports = function() {
        return new CosmosReporter();
    };
})();


