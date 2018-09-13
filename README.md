# mock-acd
Send CTI messages to mock-ti.

Generates simulated ACD event messages and writes them to a Rabbit PUB socket addressed as  _cti_.

Expects a configmap named _mock-ba_ with a value for _rabbit-amqp_ as the URL for the Rabbit.

On start it tries to connect to Rabbit, and retries every 3 seconds until successful.
Every 100 milliseconds it generates between 0 and _mock-acd-messageRate_ fake calls.
The value of _mock-acd-messageRate_ is specified in _mock-ba/_ka8s/configmap.yml_.

Each call ends up generating 2 messages, a _begin_ and an _end_.
Each message has a timestamp.
The _begin_ event timestamp falls with 100 milliseconds of now.
The _end_ event timestamp is between 60 and 300 seconds later.
to _cti_.
Each event is written to a rabbit exchange named _cti_ as soon as its timestamp is in the past.

The message structure is illustrated by the following example:
```
{
  "callId": 46395,
  "eventId": 2,
  "timestamp": "2018-04-05T23:19:26.435Z",
  "eventType": "end call"
}
```

## Build and Push
```
$ cd /home/doug/development/github/kubernetes
$ docker build --no-cache -t matr/mock-acd:1.2.3 mock-ti/_docker/boron
$ docker tag matr/mock-acd:1.2.3 matr/mock-ti:latest
$ docker push matr/mock-acd:1.2.3
$ docker push matr/mock-acd:latest
```

## Deploy
```
> cd c:/users/matr00659/development/github/kubernetes
> kubectl -f mock-acd/_k8s/service.yml
> kubectl -f mock-acd/_k8a/deployment.yml
```
