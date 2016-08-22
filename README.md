# wsps-jsclient
WebSocket Publish-Subscribe pattern implementation for JavaScript. (Client-Side)

## Using
You can use this lib as client side only without the need to connect to a WebSocket server.

Call WSPS.Manager.
* `subscribe(channelName, subscriber);` //To subscribe an object to a channel.
* `unsubscribe(channelName, subscriber);` //To unsubscribe an object from a channel.
* `publish(channelName, data, sender, range);` //To publish data to subscriber at a channel.

 range is an optional parameter, by default its WSPS.Range.All.
 
 sender is always the sending object. 
 
 If sending object is WSPS.Manager, then on the notify function event.sentBy is WSPS.Range.Server,
 because WSPS.Manager has no own subscriptions and acts as the server.
 (Each subscription from WSPS.Manager is a subscription from server).
 
 
Each subscribing object must have a globaly accesible `notify(channelName, event)` function.
This function will be called on each publish with the same channel name.

The event structure is this:

`event = {
  data : ...,
  sentBy : WSPS.Sender.*,
  sender : Object,
  range : WSPS.Range.*,
}`

* Data send by publisher, should be string, numeric or object. (Objetcs are sent to server as json string.)
* If sender is WSPS.Manager, then this is Server als its Client.
* `WSPS.Range.` `All` means send to server and allow server to send to other clients. `ServerOnly` means, send to server but dont allow sending to other clients. `ClientOnly` means, do not send to server.

## Example
### Without server
![alt tag](https://acevik.de/img/wsps-jsclient-example3.png)
![alt tag](https://acevik.de/img/wsps-jsclient-example2.png)
 
### With server
![alt tag](https://acevik.de/img/wsps-jsclient-example4.png)
![alt tag](https://acevik.de/img/wsps-jsclient-example5.png)

![alt tag](https://acevik.de/img/wsps-jsclient-example6.png)
![alt tag](https://acevik.de/img/wsps-jsclient-example7.png)

## Libraries
### Client-Side
* JavaScript [wsps-jsclient](https://github.com/vimac001/wsps-jsclient) *(this)*

### Server-Side
* Java [wsps-jserver](https://github.com/vimac001/wsps-jserver)
* *Other cooming soon*
