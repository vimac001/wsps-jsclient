# [WSPS Documentation](https://docs.google.com/document/d/1z65cn5PC74BamNzBEvYo6UwqTKxQEhBByh6a12RDuT8/edit?usp=sharing)

# What is WSPS

**W**eb**S**ocket **P**ublish **S**ubscribe  is a communcation way between client and server (and other client) based on the publish-subscribe pattern. It is primary used in web development to communicate between JavaScript client elements and server elements in any other language.

## Channel

A channel is an event name. When a message is published to a specific channel, all subscribers subscribed to this channel receive the published data.

## Subscriber

Subscribers have all a method called notify and after a subscriber subscribed a channel, this method will be called each time, a publisher publishes a message at this channel. To subscribe a channel the Subscriber has to call the subscribe method of the *PatternManager*.

### Notify

The notify method has 2 parameters: 

*Subscriber.*notify(channel, event)

A subscriber can subscribe to multiple channels, the channel parameter contains the name of the channel, where the data was published at.

The event is an object that has the following structure.

event : {

    data : [mixed],

    sentBy : [client, server],

    sender : [object],

    range : [client, server, all]

}

data : You, the developer defines which data is published and how the subscribers works with it. There is only one little constraint. When you want to publish data to the server and/or to other clients, the data has to be sent to or through the server. So it is a bit difficult to send a function. Thats why data, thats range is bigger than the client itself, must be only of some choosen types. More about it later.

sentBy : This tells you, which side (your client or the server) has published the data.

sender : Is the object, that has published the data. (Publishing object) This can also be null.

range : The range tells the API how far the published data was sent. (More about it later)

### Subscribe & Unsubscribe

The both methods have 2 parameters: 

*PatternManager*.(un)subscribe(channel, subscriber)

The channel can also be a list of channel names and the subscriber is the subscribing object itself.

## Publisher

Publishers publish data to a channel. Thay simply call the publish method of the pattern manager. So data can be published anywhere and any time. The publishing object (sender) is the object, the publish method was called in.

### Publish

The publish method has 4 parameters: 

*PatternManager*.publish(channel, data[, sender[, range]])

A publisher can publish data to any channel, so the channel, to publish data on, has to be named.

When the publish call has multiple channels, the channel parameter can be a list of channel names.

The published data can be evrything with the constraint I will explain later, when you want to publish the data with a greater range than client-side only.

The sender is the publishing object it self. (See Publisher) Default it is undefined.

The range tells the API how far to publish the data. More about it now. Default is Server.

## Range

The range is just a number, which tells the API, how far the data should be send. The farnesses are:

Client = 0 : Publish the data only at current client. Do not send to server.

Server = 1 : Publish the data at current client and at server, but tell the server not to send the data to other clients (as a publish, in other ways it is still the decision of the server (developer)).

All = 2 : Publish the data at client, server and tell the server to route the published data to other clients. (For the other clients it looks like, thay have got a publish called by the server.)

# Protocol Syntax

The protocol begins with a character and contains parameters with a prefix of thair length concluded by a ‘:’ if needed.

**Important!** The API has allready implemented the protocol syntax, but if you want to create your own API, you need to know this.

## Subscribe

A subscribe call over the network is initiated by the character s followed by the channel name.

Example: "sChannelName" or concat(‘s’, channel)

Multiple channel names have to be separated by a comma ‘,’. Commas in channel names have to be escaped with a backslash ‘\’.

Example: concat(‘s’, "channel1", ‘,’, “channel\,s”) or “schannel1,channel\,s”

Maybe you need to escape your backslas, it depends on which language you’re using. In JavaScript you need to do it.

**Important!** When the client connects to the server, both sides subscribe to each other all channels, where there are subscribtions at. On creating a new channel a new subscription will be sent to the other side. (New channels will be created, each time a subscriber subscribes to a channel without subscriptions. Also when the channel had subscriptions befor.)

## Unsubscribe

An unsubscribe call is initiated by the character u followed by the channel name. 

(Same like subscribe, also with multiple channel names.)

**Important! ** An unsubscribe call will only be sent, when the last subscriber unsubscribed to that channel.

## Publish

The publish call is initiated by the character p followed by the range, the channel name length concluded by ‘:’ the channel name and finally the data encoded with the data syntax as followed.

The range is only one digit long!

Example: "p111:HelloWorld!sThis is the data." or 

concat(‘p’, range.toString(), channel.length.toString(), ‘:’, channel, encodedData(data))

**Important!** The publish call will only be executed, when the range is far enough and the type of data is allowed for this farness. (Allowed types for data as followed.)

## Data Syntax

The data can only be transfaired to the server, when it has one of the following types:

string : is initiated with the character s followed by the string value as plain text (without quotes).

number : is splited into two categories of numbers:

  integer : is initiated with the character i and

  float : with the character f followed by the number as plain text str (without quotes). (f3.14159)

object : is initiated with the character j for **JSON **followed by the stringified version of the object.

null: is initiated with the character n for null followed by nothing.

[[TOC]]

