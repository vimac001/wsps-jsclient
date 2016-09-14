# What is WSPS
**W**eb**S**ocket **P**ublish-**S**ubscribe is a communcation way between client and server (and other client) based on the publish-subscribe pattern. It is primary used in web development to communicate between JavaScript client elements and server elements in any other language.

#### [WSPS Documentation for API Developers](https://docs.google.com/document/d/1z65cn5PC74BamNzBEvYo6UwqTKxQEhBByh6a12RDuT8/edit?usp=sharing)

# How to use wsps-jsclient
Like all js files, you also need to include *wsps.js*
```html
<script type="text/javascript" src="wsps.js"></script>
```
This lib do not use any 3rd party libs and do not have any known conflicts.

## How to subscribe a channel

```js
var cls = function() {
    //Any time an object of cls is created, this object subscribes.
    WSPS.Manager.subscribe('channel-name', this);
    WSPS.Manager.subscribe('channel-name2', this);
    
    this.notify = function(channel, event) {
        //This method is required in any subscriber.
    };
}

var obj1 = new cls(); //Two subscribtions done.
var obj2 = new cls(); //Also two subscribtions done but the subscribing object is different.
```

### *notify* method explained
```js
function notify(channel, event);
```
Each time data is published to a channel, all subscribers subscribed to this channel will receive this data.
To receive this data, the subscribing object must have a *notify* method. This method will be called and the data will be passed as parameters to this method.

##### *channel* parameter explained
This parameter contains the same channel name, this subscribing object subscribed to and the data was published at. But ofcourse the subscribing object can subscribe to multiple channels but it has always **only one notify method**, so this is the most important reason, why you need this parameter. You have to use it to distinguish between the channels.
```js
function notify(channel, event) {
    switch(channel) {
        case 'channel-name':
            //Do sth with event.
            break;
        case 'channel-name2':
            //Do sth different with event.
            break;
    }
}
```

##### *event* parameter explained
This parameter contains the published data and some other information, which can maybe be helpful. Just look at the structure of this js object.
```js
event : {
    data : mixed, //This contains the published data. It can be a string, number, object/array and null
    sendBy : WSPS.Sender.*, //This contains a string which tells you who published this data. (Client or Server)
    sender : object, //This is the publishing object (or null if anonymous).
    range : WSPS.Range.* //This is the range (also a number), how far this data was published.
}
```
*sendBy* and *range* are both just values, but thay are intended as _enumerations_.

### *Sender* enumeration explained
```js
WSPS.Sender = {
    Client : 'client',
    Server : 'server'
};
```
This enumeration is used to tell the subscriber, who has published this data.
```js
function notify(channel, event) {
    switch(event.sendBy) {
        case WSPS.Sender.Client:
            //The data was published at client side. (This client, where the code runs)
            break;
        case WSPS.Sender.Server:
            //The data was published at server side. (So WSPS.Manager is the sender)
            break;
    }
}
```

### *Range* enumeration explained
```js
WSPS.Range = {
    ClientOnly : 0,
    ServerOnly : 1,
    All : 2
};
```
This enumeration is used to tell, how far the published data can be reached. By default it is *ServerOnly* but this do not menas only the server. It is hierarchic structured.
```js
function notify(channel, event) {
    switch(event.range) {
        case WSPS.Range.ClientOnly:
            //This data was published to all subscribers at client side only. (This client, where the code runs)
            break;
        case WSPS.Range.ServerOnly:
            //This data was published to all subscribers at client side and server side.
            //But at server side only to subscriber elements of the server itself.
            break;
        case WSPS.Range.All:
            //This data was publied to all subscribers at client side, server side and 
            //the server has to publish the data to other clients connected with him.
            //Use this very carefully!
            break;
    }
}
```

## How to publish data
```js
WSPS.Manager.publish('channel-name', data, null, WSPS.Range.ClientOnly); // Or...
function cls() {
    var ths = this;
    
    this.changeAnyValue = function(newValue) {
        WSPS.Manager.publish('anyValue.change', newValue, ths);
    };
}

var obj = new cls();
obj.changeAnyValue(42);
```

There is no more, that's all.

### *publish* method explained
```js
function publish(channel, data[, sender=null[, range=WSPS.Range.ServerOnly]]);
```
This metod can be called any time from any point of code and is used to publish data to all subscribers subscribed to the channel.

##### *channel* parameter explained
All subscribers subscribed to this channel will receive the published data. (Their notify method will be called)

##### *data* parameter explained
For *data* can be anything passed. Event functions.
**Important!** Only data of type _string_, _number_ and _object_ can be sent to server. So when you use a range greater than ClientOnly, make shure that your data is of this type. (More about it you can fint in the WSPS Documentation)

##### *sender* parameter explained
The *sender* is always the object, that published the data. Sometimes there is no object, in that case you can pass a null.

##### *range* parameter explained
Any time you publish data, you have the choice, how far you want to publish them. By default you publish data always to your client and the server, but not to other clients. This is more secure.

## How to connect to a wsps-server
```js
WSPS.Manager.connect('wss://127.0.0.1:1337').then(function() {
    //Do sth. when connected successfully.
}, function(err) {
    //Do sth. when not!
});
```

# Links
### Client APIs
 + JavaScript [*wsps-jsclient*](https://github.com/vimac001/wsps-jsclient)

### Server APIs
 + Java [wsps-jserver](https://github.com/vimac001/wsps-jserver) *in progress*
 + PHP *in progress*
 + .NET *in progress*
 + C++ *in progress*
