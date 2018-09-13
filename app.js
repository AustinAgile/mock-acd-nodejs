var _ = require('lodash');
var rabbit = require('rabbit.js');
var k8sProbes = require('kubernetes-probes');
var config = require('k8s-configmap-volumes')();
var prometheus = require('k8s-prometheus-metrics')();

const monitor = {
	out: new prometheus.Counter({ name: 'mock_acd_outgoing', help: 'count of outgoing messages', labelNames: [ 'messageType' ] })
};
monitor.out.reset();

config.onChange = function(name) {console.log("config changed "+name);};
config.add("rabbit-amqp", '/etc/config/rabbit-amqp');
config.add("messageRate", '/etc/config/messageRate');
config.add("exchangeName", '/etc/config/exchangeName');

var probes = {
	readiness: false,
	liveness: true
};
k8sProbes.addReadinessFunction(function(cb) {cb(probes.readiness);});
k8sProbes.addLivenessFunction(function(cb) {cb(probes.liveness);});
k8sProbes.listen(80);

var pubInterval;
var contextTimeout;
var callId = 1;
var events = [];

config.getAll(getGoing);
function getGoing(rabbitAmqp) {

	if (contextTimeout) {clearTimeout(contextTimeout)};
	if (pubInterval) {clearInterval(pubInterval)};

	var contextRetry = 3;
	rabbit.createContext("amqp://"+config.get("rabbit-amqp"))
	.on('error', function (error) {
		probes.readiness = false;
		console.log('Error getting a rabbit context. Will try again in '+contextRetry+' seconds.');
		console.log(error);
		contextTimeout = setTimeout(function () {
			console.log("Trying again to get a rabbit context.");
			getGoing();
		}, 1000*contextRetry);
	})
	.on('close', function() {
		probes.readiness = false;
		console.log("rabbit context closed");
		if (pubInterval) {clearInterval(pubInterval)};
	})
	.on('ready', function () {
		probes.readiness = true;
		console.log('Rabbit context is ready.');

		var pub = this.socket('PUB', {
			persistent: false
		});

		pub.connect(config.get("exchangeName"), function () {
			console.log("Connected to rabbit exchange: "+config.get("exchangeName"));
			console.log("Will generate events at a rate of "+config.get("messageRate")+" calls per second.");
			pubInterval = setInterval(function() {
				var count = Math.round(Math.random()*2*Number(config.get("messageRate"))/10);
				for (var i=0; i<count; i++) {
					callId += 1;
					events.push({
						callId: callId,
						eventId: 1,
						timestamp: new Date(),
						eventType: "begin call"
					});
					events.push({
						callId: callId,
						eventId: 2,
						timestamp: new Date(Date.now() + 6000 + Math.round(3000 * Math.random())),
						eventType: "end call"
					});
				}
				var now = new Date();
				var x = _.remove(events, function(event) {
					return event.timestamp < now;
				});

				_.forEach(x, function(event) {
					setTimeout(function() {
						try {
							pub.write(Buffer.from(JSON.stringify(event, null, 2)));
							monitor.out.inc({messageType: event.eventType});
//							console.log("wrote");
						} catch(err) {
							console.log(err);
						}
					}, 5);
				});
			}, 100);
		});
	});
}