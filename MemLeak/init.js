if (ds.Main.count() === 0) {
	var content = File(application.getFolder('path') + 'licenseEnterprise.txt').toString();
	for (var i = 0; i < 50000; i++) {
		var entity = ds.Main.createEntity();
		entity.content = content;
		entity.save();
	}
}
addHttpRequestHandler('/test.*', 'test', 'test');
'ok';