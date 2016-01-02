/** \file
 * Filter twitter's notification system.
 *  
 * Most abusive tweets come from certain classes of accounts:
 *
 * - fewer than N followers
 * - newer than some date
 * - don't follow you
 * - you don't follow
 * - Mention blacklisted individuals
 * - Use blacklisted terms
 * - Follows blacklisted individuals
 *
 * This adds a score to each tweet, based on this criteria and allows ones that
 * score higher than some value to be hidden or muted.
 *
 * Additional desirable features:
 * - "Block all" to do a bulk block on high-scoring accounts
 * - Integration with other block lists
 * - Retweets of tweets that mention you but otherwise meet the criteria can be blocked.
 * - Favorites of tweets that mention you can be blocked
 *
 */
// ==UserScript==
// @name        Twitter hide non-followers
// @namespace   https://github.com/osresearch/UserScripts
// @description Hide tweets by non-followers
// @author      hudson
// @copyright   2015+, Trammell Hudson (https://trmm.net/)
// @license     GNU GPLv2
// @homepage    https://trmm.net/UserScript
// @include     *://twitter.com/i/notifications
// @exclude     *://twitter.com/
// @exclude     *://twitter.com
// @version     2
// @grant       GM_xmlhttpRequest
// @grant       GM_log
// @grant       unsafeWindow
// ==/UserScript==

// We use the follower button to find out stats about the user.
var user_url = "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?user_ids=";

// track a per-user id set of information about the user
// fields: follower_count, join_date
var user_info = {};

function block(d)
{
	//d.style.display = "none";
	d.style.background = "#000";
}


function mute(d)
{
	d.style.background = "#888";
}


// Update the user info for a list of user ids
// this uses the follow-button URL to be able to extract the
// follower count without an API key. should perhaps fetch the
// user id page instead
function update_user_info(new_users)
{
	if (new_users.length == 0)
		return;

	GM_xmlhttpRequest({
		method: "GET",
		url: user_url + new_users.join(","),
		onload: function(xhr) {
			// is there a better way to turn json into structs?
			var data = eval("(" + xhr.responseText + ")");

			data.forEach(function(user) {
				user_info[user.id] = {
					"screen_name": user.screen_name,
					"name": user.name,
					"follower_count": user.followers_count,
				};
			});
		},
	});
}

// Attempt to extract the uid from a stream-item
// there is probably a better way to do this
function get_uid(d)
{
	// skip things that aren't tweets or mentions
	var type = d.getAttribute("data-component-context");
	if (!type)
		return null;
	if (type !== "favorited_mention_activity"
	&&  type !== "retweeted_mention_activity"
	&&  type !== "quote_activity"
	&&  type !== "reply_activity"
	&&  type !== "mention_activity"
	)
		return null;

	var match = /data-user-id="([0-9]+)"/.exec(d.innerHTML);
	if (!match)
		return null;
	return match[1];
}


function score_tweet(d, user)
{
	// if we have already scored this, don't do it again
	if (d.getElementsByClassName("user-info").length !== 0)
		return;

	// extract the list of mentions and follow state
	var h = d.innerHTML;
	var match;

	var mentions = [];
	var you_follow = false;
	var follows_you = false;

	match = /data-mentions="(.*?)"/.exec(h);
	if (match)
		mentions = match[1].split(" ");

	match = /data-you-follow="(.*?)"/.exec(h);
	if (match)
		you_follow = match[1] == "true";

	match = /data-follows-you="(.*?)"/.exec(h);
	if (match)
		follows_you = match[1] == "true";

	var follower_count = user.follower_count;

	// score it!
	var score = 0;
	if (follower_count < 10)
		score += 5;
	if (follower_count < 20)
		score += 5;
	if (!follows_you)
		score += 2;

	// todo: walk list of mentions to see if anyone you block
	// is mentioned. this would be a red flag and worth many points
	//
	// todo: retrieve join date from profile page.

	// white list anyone you follow
	if (you_follow)
		score = 0;
	

	// add the user info field
	var div = document.createElement("span");
	div.setAttribute("class", "user-info");
	div.setAttribute("follower_count", follower_count);
	div.setAttribute("score", score);
	div.appendChild(document.createTextNode(
		" (" + follower_count + " followers, "
			+ you_follow + "/" + follows_you
			+ ", score " + score + ")"
	));

	// find the header to add this to
	var headers = d.getElementsByClassName("stream-item-activity-header");
	if (headers.length === 0)
		headers = d.getElementsByClassName("stream-item-header");
	if (headers.length !== 0)
		headers[0].appendChild(div);
	

	if (score > 10)
		block(d);
	else
	if (score > 6)
		mute(d);
}


window.setInterval(function() {
	var stream = document.getElementsByClassName("stream-item");
	var blocked = 0;

	// walk all of the stream and build the user info database
	var new_users = [];
	for(var i = 0 ; i < stream.length ; i++)
	{
		var d = stream[i];
		var uid = get_uid(d);
		if (!uid)
			continue;
		if (uid in user_info)
			score_tweet(d, user_info[uid]);
		else
			new_users.push(uid);
	}

	// retrieve all of the new user id data
	update_user_info(new_users);
}, 5000);
