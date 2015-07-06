#! /usr/bin/env node

var async = require('async'),
	request = require('request'),
	os = require('os'),
	child_process = require('child_process'),
	target = 'http://127.0.0.1:8081/rpc/',
	delay = 500,
	nbInjectors = 2,
	parallelStack = [],
	lastMemoryUsage = null,
	initialMemoryUsage,
	post,
	info,
	i,
	plateform,
	since = new Date();

if (/^darwin/i.test(process.platform) === true) {
	plateform = 'mac';
} else if (/^win/i.test(process.platform) === true) {
	plateform = 'win';
} else {
	plateform = 'linux';
}

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
	(function(i) {
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
					var now = new Date();
					console.log('');
					console.log(now.toLocaleString());
					console.log('Elapsed Time: ' + ((now.getTime() - since.getTime()) / (1000 * 60)).toFixed(2) + 'mn');
					console.log('OS Total Memory: ' + (os.totalmem() / 1024 / 1024).toFixed(2) + 'Mb');
					console.log('OS Free Memory: ' + (os.freemem() / 1024 / 1024).toFixed(2) + 'Mb');
					console.log('OS Memory Used: ' + (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2) + '%');
					if (!e) {
						try {
							info = JSON.parse(data);
							console.log('Wakanda Cache Size: ' + (info.cacheSize / 1024 / 1024).toFixed(2) + 'Mb');
							console.log('Wakanda Used Cache: ' + (info.usedCache / 1024 / 1024).toFixed(2) + 'Mb');
						} catch (ignore) {}
					}
					if (plateform === 'win') {
						child_process.exec('tasklist /nh /fi "Imagename eq Wakanda Server.exe" /fo CSV', function(error, stdout, stderr) {
							var memoryUsage = stdout.toString().split(',')[4];
							memoryUsage = parseInt(/(\d+)/.exec(memoryUsage.replace(/\D/g, ''))[1].trim()) / 1024;
							if (lastMemoryUsage !== null) {
								if (memoryUsage < lastMemoryUsage) {
									console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[32m[-]\033[0m');
								} else if (memoryUsage > lastMemoryUsage) {
									console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[31m[+]\033[0m');
								} else {
									console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[34m[=]\033[0m');
								}
								console.log('(Initial Wakanda Used Memory: ' + initialMemoryUsage.toFixed(2) + 'Mb)');
							} else {
								console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m');
								initialMemoryUsage = memoryUsage;
							}
							lastMemoryUsage = memoryUsage;
							console.log('');
							setTimeout(next, delay, err);
						});
					} else if (plateform === 'mac') {
						child_process.exec("ps -A | grep -m1 Enterprise | awk '{print $1}'", function(error, stdout, stderr) {
							var pid = stdout.toString().trim();
							child_process.exec('top -pid ' + pid + ' -l 1 -stats mem', function(error, stdout, stderr) {
								var memoryUsage = stdout.toString().trim().split(/\r?\n/);
								memoryUsage = memoryUsage[memoryUsage.length - 1];
								if (/K/.test(memoryUsage) === true) {
									memoryUsage = parseInt(memoryUsage) / 1024;
								} else if (/M/.test(memoryUsage) === true) {
									memoryUsage = parseInt(memoryUsage);
								} else {
									memoryUsage = parseInt(memoryUsage) * 1024;
								}
								if (lastMemoryUsage !== null) {
									if (memoryUsage < lastMemoryUsage) {
										console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[32m[-]\033[0m');
									} else if (memoryUsage > lastMemoryUsage) {
										console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[31m[+]\033[0m');
									} else {
										console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m \033[34m[=]\033[0m');
									}
									console.log('(Initial Wakanda Used Memory: ' + initialMemoryUsage.toFixed(2) + 'Mb)');
								} else {
									console.log('\033[33mWakanda Used Memory: ' + memoryUsage.toFixed(2) + 'Mb\033[0m');
									initialMemoryUsage = memoryUsage;
								}
								lastMemoryUsage = memoryUsage;
								console.log('');
								setTimeout(next, delay, err);
							});
						});
					} else {
						console.log('(not implemented)');
						setTimeout(next, delay, err);
					}
				}
			);
		});
	},
	function(err) {
		console.log(err);
		process.exit(0);
	}
);