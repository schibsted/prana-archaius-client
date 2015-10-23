var request = require('sync-request');
var Rx = require('rx');
var http = require('http');

function httpGetSync(options) {
    var observable = Rx.Observable.create(function (observer) {
        var protocol = options.protocol == null ? "http" : options.protocol;
        var timeout = options.timeout == null ? 10000 : options.timeout;
        options.timeout = options.timeout == null ? 10000 : options.timeout;
        var res = request('GET', protocol + '://' + options.host + ':' + options.port + options.path, options);
        observer.onNext(
            res.getBody('utf8')
        );
        observer.onCompleted();
    });

    return observable;
};

function constructPath(accumulator, propertyKey, idx) {
    var prefix = idx == 0 ? "" : "&";
    return accumulator + prefix + "id=" + propertyKey;
}

function requestArchaiusProperties(props, options) {
    var observable = Rx.Observable.from(Object.keys(props))
        .reduce(constructPath, "/dynamicproperties?")
        .map(function (path) {
            options.path = path;
            return options;
        })
        .flatMap(function (httpOptions) {
            return httpGetSync(httpOptions);
        })
        .map(function toJson(body) {
            return JSON.parse(body);
        });

    return observable;
}

function convertArchaiusValue(fetchedValue, defaultValue) {
    // Try to convert fetched value to the same type as the default value
    if(typeof fetchedValue == "string") {
        switch (typeof defaultValue) {
            case "boolean":
                fetchedValue = fetchedValue === 'true';
                break;
            case "number":
                fetchedValue = Number(fetchedValue);
                break;
            default:
            // Leave as string
        }
    }
    return fetchedValue;
}

function setConfValues(props, options, config) {
    requestArchaiusProperties(props, options)
        .map(function convertResponseToConf(jsonResponse) {
            Object.keys(props).forEach(function (key) {
                var defaultValue = props[key][1];
                var fetchedValue = convertArchaiusValue(jsonResponse[key], defaultValue);
                var confKey = props[key][0];
                var confValue = fetchedValue != null ? fetchedValue : defaultValue;

                var key_split = confKey.split('.');
                if (key_split.length > 1) {
                    if (config[key_split[0]] == null) {
                        config[key_split[0]] = {}
                    }
                    config[key_split[0]][key_split.slice(1).join('.')] = confValue;
                } else {
                    config[confKey] = confValue;
                }
            });
        })
        .subscribe();
}

exports.client = function (props, options) {
    var config = {};
    setConfValues(props, options, config);
    return config
};