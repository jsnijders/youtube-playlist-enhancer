// this function Copyright (C) 2015 Ryan Morr
// http://ryanmorr.com/using-mutation-observers-to-watch-for-element-availability/
(function(win){
    'use strict';
    
    var listeners = [], 
    doc = win.document, 
    MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
    observer;
    
    function ready(selector, fn){
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if(!observer){
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true
            });
        }
        // Check if the element is currently in the DOM
        check();
    }
        
    function check(){
        // Check the DOM for elements matching a stored selector
        for(var i = 0, len = listeners.length, listener, elements; i < len; i++){
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for(var j = 0, jLen = elements.length, element; j < jLen; j++){
                element = elements[j];
                // Make sure the callback isn't invoked with the 
                // same element more than once
                if(!element.ready){
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    // Expose `ready`
    win.ready = ready;
            
})(this);

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// for date suffix checking
function include(arr, obj) {
    return (arr.indexOf(obj) != -1);
}





function modifyPlaylistPage() {
	// remove the total duration container before injecting it
	var total_duration = document.getElementById('total-duration-container');
	if (total_duration) { total_duration.parentNode.removeChild(total_duration); }

	// sum all timestamps to get the playlist's total number of seconds
	var total_seconds = 0;
	var timestamps = document.querySelectorAll(".timestamp > *");

	Array.prototype.forEach.call(timestamps, function(element, i) {
		var value = element.innerText;
		
		// finding 3 parts means H:M:SS
		// finding 2 parts means M:SS
		var parts = value.split(":");
		if (parts.length == 3) { total_seconds += parseInt(parts[0]*60*60) + parseInt(parts[1]*60) + parseInt(parts[2]); }
		else { total_seconds += parseInt(parts[0]*60) + parseInt(parts[1]); }
	});

	// ignore playlists without any videos
	if (total_seconds == 0) { return; }

	// add a new container with the playlist's total duration
	var years = Math.floor(total_seconds / 31536000);
	var days = Math.floor((total_seconds % 31536000) / 86400); 
	var hours = Math.floor(((total_seconds % 31536000) % 86400) / 3600);
	var minutes = Math.floor((((total_seconds % 31536000) % 86400) % 3600) / 60);
	var seconds = (((total_seconds % 31536000) % 86400) % 3600) % 60;

	// version 1: the numerical version on the righthand side of the container
	var total_duration_short = "";
	if (years > 0) { total_duration_short += years + ":"; }
	if (days > 0) { total_duration_short += days + ":"; }
	if (hours > 0) { total_duration_short += pad(hours, 2) + ":"; }
	total_duration_short += pad(minutes, 2) + ":";
	total_duration_short += pad(seconds, 2);

	// version 2: the human readable version on the lefthand side of the container
	play_all_link = document.getElementsByClassName("playlist-play-all")[0].getAttribute("href");
	var total_duration_long = "<p>";
	if (years > 0) { total_duration_long += years + " years, "; }
	if (days > 0) { total_duration_long += days + " days, "; }
	if (hours > 0) { total_duration_long += hours + " hours, "; }
	total_duration_long += minutes + " minutes and ";
	total_duration_long += seconds + " seconds.";
	total_duration_long += ' That\'s for a total of <span id="available_videos"></span> videos (<span id="unavailable_videos"></span> deleted and/or private videos were excluded).</p>';
	total_duration_long += ' <p style="margin-top:20px;">Start watching now and you will finish <span id="finished_watching">before you know it</span>. Click <a href="' + play_all_link + '">here</a> to begin.</p>';

	// inject container
	document.querySelector('div.branded-page-v2-primary-col > div.yt-card').insertAdjacentHTML('afterend', '\
		<div id="total-duration-container" class="yt-card clearfix"> \
			<div class="branded-page-v2-body branded-page-v2-primary-column-content"> \
				<div id="pl-header" class="branded-page-box clearfix"> \
					<div class="pl-header-content"> \
						<h1 class="pl-header-title"> \
						Total playlist time \
						</h1> \
						' + total_duration_long + ' \
						\
						<div style="position:absolute; right:0; top:0; font-size:20px; font-weight:500; color:#333;"> \
						' + total_duration_short + ' \
						</div> \
					</div> \
				</div> \
			</div> \
		</div> \
	');
	
	// use the playlist's total number of seconds to calculate the point in time at which the user will have finished watching the entire playlist
	var finished_watching = new Date();
	finished_watching.setSeconds(finished_watching.getSeconds() + total_seconds);

	// 1nd, 2nd, 3rd, 4th, etc.
	var suffix = "th";
	if (include([1, 21], finished_watching.getDate())) { suffix = "st"; }
	else if (include([2, 22], finished_watching.getDate())) { suffix = "nd"; }
	else if (include([3, 23], finished_watching.getDate())) { suffix = "rd"; }

	// human readable notation for days and months
	// to be used for the projected time and date
	const all_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const all_months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	// inject projected time and date in the new container
	var finished_watching_formatted = "{0} {1} {2}{3}, {4} at {5}:{6}:{7}".format(
		all_days[finished_watching.getDay()],
		all_months[finished_watching.getMonth()],
		finished_watching.getDate(),
		suffix,
		finished_watching.getFullYear(),
		pad(finished_watching.getHours(), 2),
		pad(finished_watching.getMinutes(), 2),
		pad(finished_watching.getSeconds(), 2)
	);
	document.getElementById("finished_watching").innerText = "on " + finished_watching_formatted;

	// inject video counts in the new container
	var available_videos = document.getElementsByClassName("timestamp").length;
	var total_videos = document.getElementsByClassName("pl-video").length;
	var unavailable_videos = total_videos - available_videos;
	document.getElementById('available_videos').innerText = available_videos;
	document.getElementById('unavailable_videos').innerText = unavailable_videos;
}

ready('#pl-video-list', function(element) {
	// deal with the possibility of a node with id 'pl-video-list' on a page other than /playlist
	if (/^\/playlist.*/.test(window.location.pathname) === false) {	return;	}

	// execute on element load
	modifyPlaylistPage();

	// execute on element change
	var videos = document.getElementById('pl-video-list');
	var observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			modifyPlaylistPage();
		});    
	});
	observer.observe(videos, { childList: true });
});





function modifyWatchPage() {
	// remove the already existing text container before injected a new one
	var control_playlist_duration = document.getElementById('control-playlist-duration');
	if (control_playlist_duration) { control_playlist_duration.parentNode.removeChild(control_playlist_duration); }

	// get the url to the playlist's page
	var playlist_url = document.querySelector("*[data-full-list-id]");
	if (playlist_url === null) { return; }

	// extract playlist id from the playlist's url
	var playlist_id = playlist_url.getAttribute("data-full-list-id");
	if (playlist_id === null) { return; }
	console.info(playlist_id);

	// construct the url for obtaining the total playlist's duration from the backend server
	var total_duration_url = "https://youtube-playlist-enhancer.appspot.com/GetPlaylistDuration/v1/?playlist_id=" + playlist_id;
	var request = new XMLHttpRequest();
	request.open('GET', total_duration_url, true);
	request.responseType = "json";
	request.onload = function() {
		// handle a good response
		if (this.status == 200) {
			j = this.response;
			console.log(j);
		}
		// handle a bad response
		else {
			console.error('Expected status code 200, got %s instead.', this.status);
		}
	}
	request.onerror = function() {
	    console.error('Unable to make an HTTP request.');
	}
	request.send();

	// align the new text container to the center
	var controls = document.getElementsByClassName("ytp-chrome-controls");
	if (controls.length != 1) { return; }
	controls[0].style.textAlign = "center";

	// get the time currently into the video
	var current_time_elements = document.getElementsByClassName("ytp-time-current");
	if (current_time_elements.length != 1) { return; }
	var current_time = current_time_elements[0].innerText
	console.log(current_time);

	// inject the new text container
	var left_controls = document.getElementsByClassName("ytp-left-controls");
	if (controls.length != 1) { return; }
	left_controls[0].insertAdjacentHTML('afterend', '<span id="control-playlist-duration">Playlist: 12:34 / 56:18 (90%)</span>');
}

ready('#watch-appbar-playlist', function(element) {
	if (/^\/watch.*/.test(window.location.pathname) === false) { return; }
	// modifyWatchPage();
});