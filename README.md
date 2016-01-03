Twitter XKeyScore
===

This is a **very beta** [https://en.wikipedia.org/wiki/Greasemonkey](userscript)
that works as a Chrome extension to score and filter your Twitter
notification feed.  It allows you to mute or remove notifications
from "low scoring tweets", as well as highlighting ones from friends
or that meet your own criteria.

!(https://farm6.staticflickr.com/5623/23696720549_3e6f8bb41a_z_d.jpg)[32c3 talk]
It was inspired by a talk at 32c3 in which Caroline Sinders pointed
out that there are two classes of Twitter users: the verified users
who have good tools for filtering their notification stream, and
the rest of us who are innundated with low-quality notifications.

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
