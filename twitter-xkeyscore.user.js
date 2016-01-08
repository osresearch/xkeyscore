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
 * This assigns a score to each tweet, based on these criteria and
 * allows ones that score lower than some value to be hidden or muted.
 *
 * Additional desirable features:
 * - "Block all" to do a bulk block on high-scoring accounts
 * - Integration with other block lists
 * - Retweets of tweets that mention you but otherwise meet the criteria can be blocked.
 * - Favorites of tweets that mention you can be blocked
 * - Local storage for terms, cache and scoring
 *
 */
// ==UserScript==
// @name        Twitter XKeyScore
// @namespace   https://github.com/osresearch/xkeyscore
// @homepage    https://github.com/osresearch/xkeyscore
// @description Score, filter, hide or mute notifications
// @author      hudson
// @copyright   2016+, Trammell Hudson (https://trmm.net/)
// @license     GNU GPLv2
// @include     *://twitter.com/i/notifications
// @version     2
// @grant       GM_xmlhttpRequest
// ==/UserScript==


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


function parse_profile(d, t)
{
	var join_date = '';
	var follower_count = '';
	var screen_name = '';
	var e;

/*
	e = d.getElementsByClassName("ProfileHeaderCard-screennameLink");
	if (e.length !== 0)
	{
		e = e[0].getElementsByClassName("u-linkComplex-target");
		if (e.length !== 0)
			screen_name = e.innerHTML;
	}

	unsafeWindow.parsed.push(screen_name);

	// find the join date and follower count
	var e = d.getElementsByClassName("ProfileHeaderCard-joinDateText");
	if (e.length !== 0)
		join_date = e[0].getAttribute("data-original-title");

	e = d.getElementsByClassName("ProfileNav-item--followers");
	if (e.length !== 0)
	{
		e = e[0].getElementsByClassName("ProfileNav-value");
		if (e.length !== 0)
			follower_count = e[0].innerHTML;
	}
*/
	e = d.getElementsByClassName("json-data");
	if (e.length === 0)
		return;

	var j = /class="json-data" value="(.*?)"/.exec(t);
	if (!j)
		return;
	
	var txt = document.createElement("textarea");
    	txt.innerHTML = j[1];
	var json = eval( "(" + txt.value + ")" );
	//unsafeWindow.rx = json;

	var user = json.profile_user;
	var created_at = Date.parse(user.created_at);

	user_info[user.screen_name] = {
		"id": user.id,
		"name": user.name,
		"created_at": created_at,
		"age": new Date() - created_at,
		"screen_name": user.screen_name,
		"created_at": Date.parse(user.created_at),
		"followers_count": user.followers_count,
		"friends_count": user.friends_count,
		"listed_count": user.listed_count,
		"verified": user.verified,
		"statuses_count": user.statuses_count,
		"favourites_count": user.favourites_count,
		"has_extended_profile": user.has_extended_profile,
	};
}


// Update the user info for a list of user ids
// this uses the follow-button URL to be able to extract the
// follower count without an API key. should perhaps fetch the
// user id page instead
function update_user_info(new_users)
{
	if (new_users.length == 0)
		return;

/*
	// We can use the follower button to find out stats about the user.
	var user_url = "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?user_ids=";
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
*/

	var user_url = "https://twitter.com/"
	new_users.forEach(function(user) {
		GM_xmlhttpRequest({
			method: "GET",
			url: user_url + user,
			onload: function(xhr) {
				var div = document.createElement("div");
				div.innerHTML = xhr.responseText;

				parse_profile(div, xhr.responseText);
			},
		});
		
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

	var match = /data-screen-name="(.*?)"/.exec(d.innerHTML);
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

	var follower_count = user.followers_count;
	var age = user.age / (24 * 60 * 60 * 1000); // days

	// score it!
	// high scores are good.
	var score = 0;
	if (follower_count < 10)
		score -= 5;
	if (follower_count < 20)
		score -= 5;
	if (!follows_you)
		score -= 2;
	if (age < 10)
		score -= 5;
	if (age < 20)
		score -= 5;
	if (age < 30)
		score -= 5;
	if (age > 365)
		score += 2;

	if (user.listed_count > 10)
		score += 1;
	if (user.verified)
		score += 10;

	// todo: walk list of mentions to see if anyone you block
	// is mentioned. this would be a red flag and worth many points
	//
	// todo: retrieve join date from profile page.

	// white list anyone you follow
	if (you_follow)
		score = 0;

	// translate age into something
	if (age > 365)
		age = Math.floor(age/365) + " years";
	else
	if (age > 30)
		age = Math.floor(age/30) + " months";
	else
		age = Math.floor(age) + " days";
	
	// add the user info field
	var div = document.createElement("span");
	div.setAttribute("class", "user-info");
	div.setAttribute("follower_count", follower_count);
	div.setAttribute("score", score);
	div.appendChild(document.createTextNode(
		" (" + follower_count + " followers, "
			//+ you_follow + "/" + follows_you + ", "
			+ age + ", "
			+ "score " + score
		+ ")"
	));

	// find the header to add this to
	var headers = d.getElementsByClassName("stream-item-activity-header");
	if (headers.length === 0)
		headers = d.getElementsByClassName("stream-item-header");
	if (headers.length !== 0)
		headers[0].appendChild(div);
	

	if (score < -10)
		block(d);
	else
	if (score < -5)
		mute(d);
}


//unsafeWindow.users = user_info;
//unsafeWindow.parsed = [];
//unsafeWindow.rx = '';

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
