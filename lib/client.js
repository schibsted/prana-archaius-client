'use strict';
var request = require('sync-request');
var Rx = require('rx');
var http = require('http');

function httpGetSync(options) {
    var observable = Rx.Observable.create(function (observer) {
        options.timeout = options.timeout === undefined ? 30000 : options.timeout;
        var protocol = options.protocol === undefined ? "http" : options.protocol,
            res = request('GET', protocol + '://' + options.host + ':' + options.port + options.path, options);
        observer.onNext(
            res.getBody('utf8')
        );
        observer.onCompleted();
    });

    return observable;
}
function httpGetAsync(options) {
    var observable = Rx.Observable.create(function (observer) {
        var callback = function (response) {
            var data = '';

            response.on('data', function (chunk) {
                data += chunk;
            });

            response.on('end', function () {
                observer.onNext(data);
                observer.onCompleted();
            });

            response.on('error', function (err) {
                observer.onError(err);
            });
        };

        http.get(options, callback);
    });

    return observable;
}
function constructPath(accumulator, propertyKey, idx) {
    var prefix = idx === 0 ? "" : "&";
    return accumulator + prefix + "id=" + propertyKey;
}

function requestArchaiusProperties(props, options, useSyncronousOperation) {
    var observable = Rx.Observable.from(Object.keys(props))
        .reduce(constructPath, "/dynamicproperties?")
        .map(function (path) {
            options.path = path;
            return options;
        })
        .flatMap(function (httpOptions) {
            return useSyncronousOperation ? httpGetSync(httpOptions) : httpGetAsync(httpOptions);
        })
        .map(function toJson(body) {
            return JSON.parse(body);
        });

    return observable;
}

function convertArchaiusValue(fetchedValue, defaultValue) {
    // Try to convert fetched value to the same type as the default value
    if (typeof fetchedValue === 'string') {
        switch (typeof defaultValue) {
        case 'boolean':
            fetchedValue = fetchedValue === 'true';
            break;
        case 'number':
            fetchedValue = Number(fetchedValue);
            break;
        default:
            return fetchedValue;
        }
    }
    return fetchedValue;
}

function setConfValues(props, options, config, useSyncronousOperation) {
    return requestArchaiusProperties(props, options, useSyncronousOperation)
        .map(function convertResponseToConf(jsonResponse) {
            Object.keys(props).forEach(function (key) {
                var defaultValue = props[key][1],
                    fetchedValue = convertArchaiusValue(jsonResponse[key], defaultValue),
                    confKey = props[key][0],
                    confValue = fetchedValue !== null && fetchedValue !== undefined ? fetchedValue : defaultValue,
                    key_split = confKey.split('.');
                if (key_split.length > 1) {
                    if (config[key_split[0]] === undefined) {
                        config[key_split[0]] = {};
                    }
                    config[key_split[0]][key_split.slice(1).join('.')] = confValue;
                } else {
                    config[confKey] = confValue;
                }
            });
            return config;
        });
}
/*jslint unparam: true*/
exports.archaius = function (options) {
    return {
        syncRequest: function (props) {
            var config = {};
            setConfValues(props, options, config, true).subscribe();
            return config;
        },
        asyncRequest: function (props, onSuccess, onFailure) {
            var config = {};
            setConfValues(props, options, config, false)
                .subscribe(
                    function (config) {
                        // On next do nothing
                        return;
                    },
                    function (err) {
                        onFailure(err);
                    },
                    function () {
                        onSuccess(config);
                    }
                );
        }
    };
};
/*jslint unparam: false*/
