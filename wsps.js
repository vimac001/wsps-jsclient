var WSPS = {};
WSPS.Range = {
    /**
     * Send published data to server and tell the server
     * to publish data to other connected clients.
     */
    All : 2,

    /**
     * Send published data to server and tell the server
     * not to publish data to other clients.
     */
    ServerOnly : 1,

    /**
     * Publish the date only to subscribing objects of this client.
     */
    ClientOnly : 0
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

/**
 * Makes an array of channel names to a comma separated string with escaped commas in channel names.
 * @param channel Array of channels.
 * @return mixed False of the final channel name is invalied or string of channel names.
 */
WSPS.Channel.stringify = function(channel) {
	if(typeof channel === 'object') {
		var c = null;
		if('indexOf' in channel) {
			for(var i = 0; i < channel.length; i++) {
				var chn = channel[i].replace(',', '\\,');
				if(c === null) {
					c = chn;
				} else {
					c += ',' + chn;
				}
			}
		} else {
			for(var i in channel) {
				var chn = channel[i].replace(',', '\\,');
				if(c === null) {
					c = chn;
				} else {
					c += ',' + chn;
				}
			}
		}
		
		channel = c;
	}
	
	if(typeof channel !== 'string' || channel.length <= 0) {
		return false;
	}
	
	return channel;
};

/**
 * Make a comma separated string of channel names to an array with unescaped commas in channel names. (Reverse of stringify)
 * @param channel String of channels.
 * @return mixed False on syntax error else an array with the channel names.
 */
WSPS.Channel.parse = function(channel) {
	channel = channel.replace(/\\,/g, ':--.--;');
	channel = channel.split(',');
	for(var i = 0; i < channel.length; i++) {
		channel[i] = channel[i].replace(/:--\.--;/g, ',');
	}
	
	return channel;
};

WSPS.Manager = (new (function(){
    var ths = this;
    var channels = {};

    // Networking
	var wcon = false;
    var sock = null;
    this.isConnected = function() {
        return (sock !== null && sock.readyState === 1);
    };

    var serverSubscribe = function(channel) {
        if(ths.isConnected()) {
			channel = WSPS.Channel.stringify(channel);
			if(!channel) {
				console.warn('Data published to bad channel!', channel);
				return;
			}
			
            var msg = 's' + channel;
            sock.send(msg);
        } else if(wcon) {
            console.warn('Channel subscribe for \'' + channel + '\' could not be sent to server.');
        }
    };

    var serverUnsubscribe = function(channel) {
        if(ths.isConnected()) {
			channel = WSPS.Channel.stringify(channel);
			if(!channel) {
				console.warn('Data published to bad channel!', channel);
				return;
			}
            var msg = 'u' + channel;
            sock.send(msg);
        } else if(wcon) {
            console.warn('Channel unsubscribe for \'' + channel + '\' could not be sent to server.');
        }
    };

    var onOpen = function(e){ wcon = true; }

    var onMessage = function(e) {
        var msg = e.data;

        if(msg.indexOf('p') === 0) {
			var rng = msg.substring(1, 1);
            var i = msg.indexOf(':', 3);
            var len = parseInt(msg.substring(2, i++));
            var channel = WSPS.Channel.parse(msg.substr(i, len));
            i += (len + 1);
            var data = msg.substr(i);
			
			switch(data.substr(0, 1)) {
				case 's':
					data = data.substr(1);
					break;
				case 'i':
					data = parseInt(data.substr(1));
					break;
				case 'f':
					data = parseFloat(data.substr(1));
					break;
				case 'j':
					data = JSON.parse(data.substr(1));
					break;
			}

            ths.publish(channel, data, this, WSPS.Range.ClientOnly);
        } else if(msg.indexOf('s') === 0) {
            var channel = WSPS.Channel.parse(msg.substr(1));
            ths.subscribe(channel, ths);
        } else if(msg.indexOf('u')) {
            var channel = WSPS.Channel.parse(msg.substr(1));
            ths.unsubscribe(channel, ths);
        }
    };

    var onClose = function(e) {

    };

    var onError = function(e) {

    };

    var initSubscribeAtServer = function(e) {
		var chans = new Array();
        for(var channel in channels) {
            chans.push(channel);
        }
		
		serverSubscribe(chans);
    };

    this.notify = function(channel, event) {
        if(event.range === WSPS.Range.ClientOnly) return;

        if(typeof event.data === 'function') {
            console.error('Invalid event data type.', event.data);
            return;
        }

        if(ths.isConnected()) {
			channel = WSPS.Channel.stringify(channel);
			if(!channel) {
				console.warn('Data published to bad channel!', channel);
				return;
			}
			
            var data = '';
            if(typeof eventData === 'string') {
                data += 's' + eventData;
            } else if(typeof eventData === 'number') {
                if(eventData % 1 === 0) {
                    data += 'i' + eventData.toString();
                } else {
                    data += 'f' + eventData.toString();
                }
            } else if(typeof eventData === 'object') {
                if(eventData === null) {
                    data += 'n';
                } else {
                    data += 'j' + JSON.stringify(eventData);
                }
            } else {
                console.warning('Type of event data is invalid. Only string, number and object allowed. Published data was not sent but published.', eventData);
                return;
            }
            var msg = 'p' + range.toString() + channel.length.toString() + ':' + channel + data;
            sock.send(msg);
        } else if(wcon) {
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
	var foreachChannel = function(channel, callback) {
		if('indexOf' in channel) {
			for(var i = 0; i < channel.length; i++) {
				var chn = channel[i];
				callback(chn);
			}
		} else {
			for(var i in channel) {
				var chn = channel[i];
				callback(chn);
			}
		}
	};

    /**
     * Subscribe a channel.
     * @param channel Channel name to subscribe.
     * @param subscriber Subscribing object to notify at.
     */
    this.subscribe = function(channel, subscriber) {
		if(typeof channel === 'object') {
			foreachChannel(channel, function(chn){
				ths.subscribe(chn, subscriber);
			});
			
			return;
		}
		
        if(!(channel in channels)) {
            channels[channel] = new WSPS.Channel(channel);
			serverSubscribe(channel);
        }else if(channels[channel].subscribersAmount() <= 0) {
			serverSubscribe(channel);
		}
		
        channels[channel].addSubscriber(subscriber);
    };

    /**
     * Publish data to a channel.
     * @param channel Channel name to publish at.
     * @param eventData Data to publish to subscribers.
     * @param sender Publishing object.
     * @param range Range how far to send the published data. (WSPS.Range.*)
     */
    this.publish = function(channel, eventData, sender, range) {
		if(typeof channel === 'object') {
			foreachChannel(channel, function(chn){
				ths.publish(chn, eventData, sender, range);
			});
			
			return;
		}
		
        range = range || WSPS.Range.ServerOnly;
        if(channel in channels && channels[channel].subscribersAmount() > 0) {
            channels[channel].notify(eventData, sender, range);
        } else {
            console.warn('Channel \'' + channel + '\' has no subscribers.');
        }
    };

    /**
     * Unsubscribe a channel.
     * @param channel Channel name to unsubscribe.
     * @param subscriber Subscribed object to identify and unsubscribe.
     */
    this.unsubscribe = function(channel, subscriber) {
		if(typeof channel === 'object') {
			foreachChannel(channel, function(chn){
				ths.unsubscribe(chn, subscriber);
			});
			
			return;
		}
		
        if(channel in channels && channels[channel].subscribersAmount() > 0) {
            channels[channel].removeSubscriber(subscriber);
			
			if(channels[channel].subscribersAmount() <= 0) {
				serverUnsubscribe(channel);
			}
        }
    };

})());
