Twitter XKeyScore
===

![Sample scoring](https://farm2.staticflickr.com/1587/23886963620_67e47d5b3d_z_d.jpg)

This is a **very beta** [userscript](https://en.wikipedia.org/wiki/Greasemonkey)
that works as a Chrome extension to score and filter your Twitter
notification feed.  It allows you to mute or remove notifications
from "low scoring tweets", as well as highlighting ones from friends
or that meet your own criteria.

In many ways the state of filtering has regressed since the days
of Usenet and threaded newsreaders.  Running this in the web browser
allows much of the control that we used to have with local newsreaders,
and doesn't require access to the Twitter API since all of the
requests come from *your web browser*, as if you were loading the pages.

Parameters that can be used for sorting:

* Age of account
* Number of followers
* Number of total tweets
* Number of favorites
* Number of lists
* Verification status
* Extended profile status
* Keywords
* Mentions
* Hash tags

Please use the issue tracker to discuss feature requests. There are many
**TODO** items in the code and the Javascript likely needs a total rewrite.

Inspiration
===

![32c3 talk](https://farm6.staticflickr.com/5623/23696720549_3e6f8bb41a_z_d.jpg)

XKeyScore for Twitter was inspired by a talk at 32c3 in which
[Caroline Sinders](https://twitter.com/carolinesinders) pointed
out that there are two classes of Twitter users: the verified users
who have good tools for filtering their notification stream, and
the rest of us who are innundated with low-quality notifications.


Development cycle
===
Building userscripts is a pain. It is as if the developers don't actually
do any sort of edit/test/debug cycle, so there is no way to easily use
normal files.

I have an nearly empty userscript in Tamper Monkey that points to a file
served on `localhost`:

<pre>
// ==UserScript==
// @name         Twitter XKeyScore wrapper
// @namespace    https://github.com/osresearch/xkeyscore
// @version      0.1
// @description  Filter out tweets
// @author       hudson@trmm.net
// @require      http://localhost:8000/twitter-xkeyscore.js
// @include     *://twitter.com/i/notifications
// @exclude     *://twitter.com/
// @exclude     *://twitter.com
// @version     2
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @grant       unsafeWindow
// ==/UserScript==
/* jshint -W097 */
'use strict';

// All the code is required from localhost
</pre>

Start a python webserver in the `xkeyscore` directory:

    python -m SimpleHTTPServer 8000

And be sure to set `Externals - Updated Interval` to `Always`.
Even with this set it seems to only re-load the code every
*second* page load, not on every load.
