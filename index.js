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
					} else {
						// MAC top -pid 460 -l 1 -stats mem
						/*
						Processes: 154 total, 3 running, 10 stuck, 141 sleeping, 564 threads 
						2015/07/06 15:07:14
						Load Avg: 2.59, 2.44, 2.49 
						CPU usage: 27.65% user, 21.27% sys, 51.6% idle 
						SharedLibs: 14M resident, 8008K data, 0B linkedit.
						MemRegions: 21392 total, 7085M resident, 73M private, 162M shared.
						PhysMem: 16G used (3859M wired), 108M unused.
						VM: 389G vsize, 1063M framework vsize, 0(0) swapins, 0(0) swapouts.
						Networks: packets: 180092/40M in, 110778/17M out.
						Disks: 46664/7073M read, 13854/349M written.

						MEM   
						6409M+
						*/
						console.log('');
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

/*
{"cacheSize":209715200,"usedCache":170489472,"entitySetCount":0,"ProgressInfo":[{"UserInfo":"indexProgressIndicator","sessions":0,"percent":0},{"UserInfo":"flushProgressIndicator","sessions":0,"percent":0}],"sessionInfo":[{"sessionID":"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","userID":"00000000000000000000000000000000","userName":"default guest","lifeTime":3600,"expiration":"2015-07-03T13:00:26.839Z"}],"jsContextInfo":[{"contextPoolSize":50,"activeDebugger":false,"threadPoolCount":6,"createdThreadPoolCount":6,"destroyedThreadPoolCount":0,"usedContextCount":4,"usedContextMaxCount":4,"reusableContextCount":5,"unusedContextCount":1,"createdReusableContextCount":5,"createdContextCount":9,"destroyedContextCount":4}]}
*/