// Copyright 2012 Mark Cavage <mcavage@gmail.com> All rights reserved.

var uuid = require('node-uuid');

var zk = require('../lib');

if (require.cache[__dirname + '/helper.js'])
        delete require.cache[__dirname + '/helper.js'];
var helper = require('./helper.js');



///--- Globals

var after = helper.after;
var before = helper.before;
var test = helper.test;

var ROOT = '/' + uuid().substr(0, 7);
var PATH = ROOT + '/' + uuid().substr(0, 7);
var FILE = PATH + '/unit_test.json';
var SUBDIR = PATH + '/foo/bar/baz';
var ZK;
var connectTimeout;


///--- Tests
before(function (callback) {
        try {
                ZK = zk.createClient({
                        connectTimeout: false,
                        log: helper.createLogger('zk.server-string.test.js'),
                        servers: [ {
                                host: process.env.ZK_HOST || '127.0.0.1',
                                port: parseInt(process.env.ZK_PORT || 2181, 10)
                        } ],
                        timeout: 1000
                });
                ZK.once('connect', function () {
                        ZK.mkdirp(PATH, function (err) {
                                if (err) {
                                        console.error(err.stack);
                                        process.exit(1);
                                }

                                callback();
                        });
                });
                ZK.connect();
        } catch (e) {
                console.error(e.stack);
                process.exit(1);
        }
});


after(function (callback) {
        ZK.rmr(ROOT, function (err) {
                if (err) {
                        console.error('Unable to clean up %s', ROOT);
                        process.exit(1);
                }
                ZK.on('close', callback);
                ZK.close();
        });
});

test('get', function (t) {
        var opts = {
                object: {
                        hello: 'world'
                }
        };
        ZK.create(FILE, opts, function (err, path) {
                t.ifError(err);
                t.ok(path);
                t.equal(FILE, path);
                ZK.get(FILE, function (err2, obj) {
                        t.ifError(err2);
                        t.deepEqual(opts.object, obj);
                        t.end();
                });
        });
});
