var WSPS = {};
WSPS.Range = {
    /**
     * Send published data to server and tell the server
     * to publish data to other connected clients.
     */
    All : 0,

    /**
     * Send published data to server and tell the server
     * not to publish data to other clients.
     */
    ServerOnly : 1,

    /**
     * Publish the date only to subscribing objects of this client.
     */
    ClientOnly : 2
};

WSPS.Sender = {
    Client : 'client',
    Server : 'server'
};

WSPS.Manager = {};

/**
 * Initializes a new channel object.
 * @param name Channel name.
 */
WSPS.Channel = function(name) {
    var ths = this;
    var notifyMethodName = 'notify';

    var subscribers = new Array();

    /**
     * Returns the name of this channel object.
     * @return Channel name.
     */
    this.getName = function() {
        return name;
    };

    /**
     * Returns the amount of subscribing objects subscribed to this channel.
     * @return Amount of subscribers.
     */
    this.subscribersAmount = function() {
        return subscribers.length;
    };

    /**
     * Add a new subscriber. (Adds the same subscribing object only once)
     * @param subscriber Subscribing object to notify.
     */
    this.addSubscriber = function(subscriber) {
        if(subscribers.indexOf(subscriber) < 0) {
            subscribers.push(subscriber);
        }

        if(!(notifyMethodName in subscriber)) {
            console.warn('Subscriber has no \'' + notifyMethodName + '\' method.', subscriber);
        }
    };

    /**
     * Removes the subscriber if is subscribing.
     * @param subscriber Subscribing object to remove from subscribers.
     */
    this.removeSubscriber = function(subscriber) {
        var i = subscribers.indexOf(subscriber);
        if(i >= 0) {
            subscribers.splice(i, 1);
        }
    };

    /**
     * Publish data to all subscribing object calling the notify method.
     * @param eventData Published data.
     * @param sender Publishing object.
     * @param range Range how far to send the published data. (WSPS.Range.*)
     */
    this.notify = function(eventData, sender, range) {
        var event = {
            data : eventData,
            sentBy : (sender === WSPS.Manager ? WSPS.Sender.Server : WSPS.Sender.Client),
            sender : sender,
            range : range
        };

        for(var i = 0; i < subscribers.length; i++) {
            var sub = subscribers[i];

            if(notifyMethodName in sub) {
                sub[notifyMethodName](name, event);
            } else {
                console.warn('Subscriber not notified! Missing method \'' + notifyMethodName + '\'.', sub);
            }
        }
    };
};

WSPS.Manager = (new (function(){
    var ths = this;
    var channels = {};

    // Networking
    var sock = null;
    this.isConnected = function() {
        return (sock !== null && sock.readyState === 1);
    };

    var serverSubscribe = function(channel) {
        if(ths.isConnected()) {
            var msg = 's:' + channel;
            sock.send(msg);
        } else {
            console.warn('Channel subscribe for \'' + channel + '\' could not be sent to server.');
        }
    };

    var serverUnsubscribe = function(channel) {
        if(ths.isConnected()) {
            var msg = 'u:' + channel;
            sock.send(msg);
        } else {
            console.warn('Channel unsubscribe for \'' + channel + '\' could not be sent to server.');
        }
    };

    //@Deprecated
    var serverPublish = function(channel, eventData, range) {
        if(range === WSPS.Range.ClientOnly) return;

        if(typeof eventData === 'function') {
            console.error('Invalid event data type.', eventData);
            return;
        }

        if(ths.isConnected()) {
            var msg = 'p:' + range.toString() + ':' + channel.length.toString() + ':' + channel + ':' +
                                            (typeof eventData === 'object' ? JSON.stringify(eventData) : eventData);
            sock.send(msg);
        } else {
            console.warn('Publishing data at channel \'' + channel + '\' could not be sent to server.');
        }
    };

    var onOpen = function(e){/* Nothing to do here... */}

    var onMessage = function(e) {
        var msg = e.data;

        if(msg.indexOf('p:') === 0) {
            var i = msg.indexOf(':', 3);
            var len = parseInt(msg.substring(2, i++));
            var channel = msg.substr(i, len);
            i += (len + 1);
            var eventData = msg.substr(i);

            ths.publish(channel, eventData, this, WSPS.Range.ClientOnly);
        } else if(msg.indexOf('s:') === 0) {
            var channel = msg.substr(2);
            ths.subscribe(channel, ths);
        } else if(msg.indexOf('u:')) {
            var channel = msg.substr(2);
            ths.unsubscribe(channel, ths);
        }
    };

    var onClose = function(e) {

    };

    var onError = function(e) {

    };

    var initSubscribeAtServer = function(e) {
        for(var channel in channels) {
            serverSubscribe(channel);
        }
    };

    this.notify = function(channel, event) {
        if(event.range === WSPS.Range.ClientOnly) return;

        if(typeof event.data === 'function') {
            console.error('Invalid event data type.', event.data);
            return;
        }

        if(ths.isConnected()) {
            var msg = 'p:' + event.range.toString() + ':' + channel.length.toString() + ':' + channel + ':' +
                (typeof event.data === 'object' ? JSON.stringify(event.data) : event.data.toString());
            sock.send(msg);
        } else {
            console.warn('Publishing data at channel \'' + channel + '\' could not be sent to server.');
        }
    };

    this.connect = function (url) {
        return new Promise(function(res, rej) {
            if(navigator.onLine) {
                try {
                    sock = new WebSocket(url);
                    sock.onopen = function(e) {
                        onOpen(e);
                        res(sock);
                    };

                    sock.onmessage = onMessage;
                    sock.onclose = onClose;
                    sock.onerror = onError;
                } catch(ex) {
                    rej(ex);
                }
            } else {
                rej('No internet connection.');
            }
        }).then(function(e){
            initSubscribeAtServer(e);
            return e;
        }, function(e){
            return e;
        });
    };

    // Publish-Subscribe

    /**
     * Subscribe a channel.
     * @param channel Channel name to subscribe.
     * @param subscriber Subscribing object to notify at.
     */
    this.subscribe = function(channel, subscriber) {
        if(!(channel in channels)) {
            channels[channel] = new WSPS.Channel(channel);
        }

        channels[channel].addSubscriber(subscriber);

        serverSubscribe(channel);
    };

    /**
     * Publish data to a channel.
     * @param channel Channel name to publish at.
     * @param eventData Data to publish to subscribers.
     * @param sender Publishing object.
     * @param range Range how far to send the published data. (WSPS.Range.*)
     */
    this.publish = function(channel, eventData, sender, range) {
        range = range || WSPS.Range.All;
        if(channel in channels && channels[channel].subscribersAmount() > 0) {
            channels[channel].notify(eventData, sender, range);
        } else {
            console.warn('Channel \'' + channel + '\' has no subscribers.');
        }

        //serverPublish(channel, eventData, range);
    };

    /**
     * Unsubscribe a channel.
     * @param channel Channel name to unsubscribe.
     * @param subscriber Subscribed object to identify and unsubscribe.
     */
    this.unsubscribe = function(channel, subscriber) {
        if(channel in channels && channels[channel].subscribersAmount() > 0) {
            channels[channel].removeSubscriber(subscriber);
        }

        serverUnsubscribe(channel);
    };

})());