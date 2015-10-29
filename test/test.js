'use strict';

var archaiusClient = require('../lib/client.js')
var spawn = require('child_process')

var port = 7002;
var proc;

var testsRun = 0;
var testsExpected = 2;

function startTest(test) {
    test._reallyDone = test.done;
    test.done = function() {
        ++testsRun;
        test._reallyDone();
    };
}

exports.integrationTest = {

    setUp: function (done) {
        // Need to fork since the sync request will block which prevents the mock server from responding
        if (!proc) {
            proc = spawn.fork('./test/prana_mock_server.js', [port])
        }
        done();
    },

    tearDown: function (done) {
        if (testsRun===testsExpected) {
            proc.kill();
        }
        done();
    },
    'sync test': function (test) {
        startTest(test)

        var props = {
            "env": ['env', 'test'],
            "port": ['port', 8888],
            "propCategory.enabled": ['category.enabled.key', true],
            "host": ['hostname', "localhost"]
        };

        var options = {
            host: 'localhost',
            port: port
        };

        var config = archaiusClient.syncRequest(props, options);

        test.equal(config.env, "dev", 'Failed to get proper config values');
        test.equal(config.port, 8000, 'Failed to get proper config values');
        test.equal(config.category['enabled.key'], true, 'Failed to get proper config values');
        test.equal(config.hostname, "localhost", 'Failed to get proper config values');

        test.done();
    },
    'async test': function (test) {
        startTest(test);

        var props = {
            "env": ['env', 'test'],
            "port": ['port', 8888],
            "propCategory.enabled": ['category.enabled.key', true],
            "host": ['hostname', "localhost"]
        };

        var options = {
            host: 'localhost',
            port: port
        };

        archaiusClient.asyncRequest(props, options, function (config) {

            test.equal(config.env, "dev", 'Failed to get proper config values');
            test.equal(config.port, 8000, 'Failed to get proper config values');
            test.equal(config.category['enabled.key'], true, 'Failed to get proper config values');
            test.equal(config.hostname, "localhost", 'Failed to get proper config values');

            test.done();
        }, function (err) {
            throw err;
        });
    }
};