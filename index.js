#! /usr/bin/env node

var async = require('async'),
	request = require('request'),
	os = require('os'),
	target = 'http://127.0.0.1:8081/rpc/',
	delay = 500,
	nbInjectors = 6,
	parallelStack = [],
	lastMemoryUsage = null,
	post,
	info,
	i;

post = function(id, callback) {
	var then = new Date(),
		now;
	console.log('POST (' + id + ')...');
	request({
			method: 'POST',
			url: target,
			headers: {
				'Connection': 'close',
				'Content-type': 'application/json-rpc; charset=utf-8',
				'Accept': 'application/json-rpc',
				'Accept-Encoding': 'gzip,deflate'
			},
			body: '{"jsonrpc":"2.0","id":' + id + then.getTime() + ',"module":"test","method":"test","params":""}'
		},
		function(err, response, data) {
			now = new Date();
			console.log('...(' + id + ') done in', ((now.getTime() - then.getTime()) / 1000).toFixed(2), 'sec.');
			callback(err);
		}
	);
};

for (i = 0; i < nbInjectors; i++) {
	(function (i) {
		parallelStack.push(function(callback) {
			post(i + 1, callback);
		});
	})(i);
}

async.forever(
	function(next) {
		async.parallel(parallelStack, function(err, results) {
			request({
					method: 'GET',
					url: 'http://127.0.0.1:8081/rest/$Info',
					headers: {
						'Connection': 'close',
						'Content-type': 'application/json; charset=utf-8',
						'Accept': 'application/json',
						'Accept-Encoding': 'gzip,deflate'
					}
				},
				function(e, response, data) {
					var memoryUsage;
					console.log('');
					if (e) {
						console.log('rest/$Info error:', e);
					} else {
						try {
							info = JSON.parse(data);
							console.log('Wakanda Cache Size: ' + (info.cacheSize / 1024 / 1024).toFixed(2) + 'Mb');
							console.log('Wakanda Used Cache: ' + (info.usedCache / 1024 / 1024).toFixed(2) + 'Mb');
						} catch (e) {
							console.log('rest/$Info error:', e);
						}
					}
					memoryUsage = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
					console.log('OS Total Memory: ' + (os.totalmem() / 1024 / 1024).toFixed(2) + 'Mb');
					console.log('OS Free Memory: ' + (os.freemem() / 1024 / 1024).toFixed(2) + 'Mb');
					console.log('OS Memory Used: ' + memoryUsage.toFixed(2) + '%');
					if (lastMemoryUsage !== null) {
						if (memoryUsage < lastMemoryUsage) {
							console.log('\033[32m[-]\033[0m');
						} else if (memoryUsage > lastMemoryUsage) {
							console.log('\033[31m[+]\033[0m');
						} else {
							console.log('\033[34m[=]\033[0m');
						}
					}
					lastMemoryUsage = memoryUsage;
					console.log('');
					setTimeout(next, delay, err);
				}
			);
		});
	},
	function(err) {
		console.log(err);
		process.exit(0);
	}
);

/*
{"cacheSize":209715200,"usedCache":170489472,"entitySetCount":0,"ProgressInfo":[{"UserInfo":"indexProgressIndicator","sessions":0,"percent":0},{"UserInfo":"flushProgressIndicator","sessions":0,"percent":0}],"sessionInfo":[{"sessionID":"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","userID":"00000000000000000000000000000000","userName":"default guest","lifeTime":3600,"expiration":"2015-07-03T13:00:26.839Z"}],"jsContextInfo":[{"contextPoolSize":50,"activeDebugger":false,"threadPoolCount":6,"createdThreadPoolCount":6,"destroyedThreadPoolCount":0,"usedContextCount":4,"usedContextMaxCount":4,"reusableContextCount":5,"unusedContextCount":1,"createdReusableContextCount":5,"createdContextCount":9,"destroyedContextCount":4}]}
*/