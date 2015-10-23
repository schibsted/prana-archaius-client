'use strict';

var archaiusClient = require('../lib/client.js')
var spawn = require('child_process')

var port = 9001;
var proc;

// TODO test property which contains &?=
exports.integrationTest = {

    setUp: function (done) {
        // Need to fork since the sync request will block which prevents the server from responding
        proc = spawn.fork('./test/prana_mock_server.js', [port])
        done();
    },
    'no args': function (test) {
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

        var config = archaiusClient.client(props, options);

        test.equal(config.env, "dev", 'Failed to get proper config values');
        test.equal(config.port, 8000, 'Failed to get proper config values');
        test.equal(config.category['enabled.key'], true, 'Failed to get proper config values');
        test.equal(config.hostname, "localhost", 'Failed to get proper config values');

        test.done();
    },

    tearDown: function(done) {
        proc.kill();
        done();
    }
};
