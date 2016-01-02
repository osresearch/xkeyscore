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
// fields: follower_count, join_date, follows_you, you_follow
var user_info = {};

function block(d)
{
	//d.style.display = "none";
	d.style.background = "#000";
	blocked++;
}

function update_user_info(d, user_id, name, cb)
{
	// we might have raced with another update,
	// so only add this element if we haven't done so
	if (name.getElementsByClassName("user-info").length != 0)
		return;

	var follower_count = user_info[user_id].follower_count;
	//name.style.background = "#f00";

	var div = document.createElement("span");
	div.setAttribute("class", "user-info");
	div.setAttribute("follower_count", follower_count);
	div.appendChild(document.createTextNode(" (" + follower_count + " followers)"));

	name.appendChild(div);

	//cb(d, user_info[user_id]);
}


function add_user_info(d, cb)
{
	// do a query to add follower count to this tweet
	var n = d.getElementsByClassName("username");
	if (n.length === 0)
		return;
	var name = n[0];

	// if we have already created the user-info field, ignore this one
	if (name.getElementsByClassName("user-info").length != 0)
		return;

	var match = /data-user-id="(.*?)"/.exec(d.innerHTML);
	if (!match)
		return;
	var user_id = match[1];

	//name.style.background = "#00f";
	if (user_id in user_info)
	{
		update_user_info(d, user_id, name, cb);
		return;
	}

	//name.style.background = "#111";

	// we don't already have it. send a request for info
	GM_xmlhttpRequest({
		method: "GET",
		url: user_url + user_id,
		onload: function(xhr) {
			//var data = eval("(" + xhr.responseText + ")");
			var rsp = xhr.responseText;
			var follower_count = /"followers_count":([0-9]+)/.exec(rsp);
			if (!follower_count)
				return;

			user_info[user_id] = {
				"follower_count": follower_count[1],
				"follows_you": true,
				"you_follow": true,
				"join_date": 0,
			};
			update_user_info(d, user_id, name, cb);
		},
	});
}


window.setInterval(function() {
	var stream = document.getElementsByClassName("stream-item");
	var blocked = 0;
	for(var i = 0 ; i < stream.length ; i++)
	{
		var d = stream[i];

		//d.style.background = "#aaa";
		add_user_info(d, function(){} ); // add_score;
	}
}, 5000);

/*
            var you_follow = /data-you-follow="(.*?)"/.exec(h);
            var follows_you = /data-follows-you="(.*?)"/.exec(h);
            var mentions = /data-mentions="(.*?)"/.exec(h);
            var follower_count = /follower-count="(.*?)"/.exec(h);
            if (mentions)
                mentions = mentions[1].split(" ");

            // todo: black list of mentions
            // todo: black list of posters

            // always show people you follow
            if (you_follow && you_follow[1] == "true")
                continue;

            // hide people who don't follow you
            if (follows_you && follows_you[1] == "false")
                block(d);

            // add follower count
            if (follower_count || !user_id)
                continue;


            // hide anyone who has less than N followers

        }

    }, 5000);
*/
