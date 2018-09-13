const fs = require('fs');
const {spawn} = require('child_process');
const kill = require('tree-kill');

function getMode() {
	fs.readFile('/etc/config/mode', function(err, data) {
		console.log(data.toString());
		if (data == 'dev') {
			killApp();
		} else {
			spawnApp();
		}
	});
}

getMode();

fs.watchFile('/etc/config/mode', { persistent: true, interval: 5007 }, getMode);

var app = null;
function spawnApp() {
	app = spawn('node', ['app']);
	app.stdout.on('data', (data) => {
		console.log(data.toString('utf8', 0, data.length-1));
	});
	app.stderr.on('data', (data) => {
		console.error(data.toString('utf8', 0, data.length-1));
	});
}
function killApp() {
	if (app != null) {
		kill(app.pid);
		app = null;
	}
}