// Globals
var queue = [];
var queuePos = -1;
var currentlyPlaying = false;
var youtubeplayer;

// Search options
var orderby = "relevance";
var time = "all_time";

// Change title and now playing header
var nowPlaying = function(title)  {
    document.title = title;
    $("#nowPlaying").text(title);
}

// autocomplete suggest
var suggestTerm = function(request, responseCB) {
	jQTubeUtil.suggest(request.term, 
		function(response) {
			responseCB(response.suggestions);
		}
	);
};

// Play whatever's on queue
var playNext = function() {
    queuePos++;
	var next = queue[queuePos];
    if (!next) {
        queuePos--;
        return false;
    }
    
    if (currentlyPlaying) {
		togglePlay();
	}
    
    jQTubeUtil.video(next,function(response){
         nowPlaying(response.videos[0].title);
    });
    
    jQuery("#player").tubeplayer("play", next);
    updateQueue();
    return false;
};

var togglePlay = function() {
	if (currentlyPlaying)
		jQuery("#player").tubeplayer("pause");
	else
	    jQuery("#player").tubeplayer("play");
};

// Callback for the search form. 
var searchCB = function(response) {
    var html = ""; 
    	for(vid in response.videos){
    		var video = response.videos[vid];
            html += "<div class=\"videoResult\">";
    		html += "<div class=\"videoThumb\">";
    		html += "<a href=\"#\" onClick=\"return addToQueue('" + video.videoId + "');\">";
    		html += "<img src=\"http://img.youtube.com/vi/" + video.videoId + "/3.jpg\"></a>";
    		html += "</div>";
    		html += "<div class=\"videoTitle\">";
    		html += "<a href=\"#\" onClick=\"return addToQueue('" + video.videoId + "');\">" + video.title + "</a>";
    		html += "</div>";
            html += "</div>";
    	}
    $("#searchResults").html(html);
};

// Takes from the front of the queue
var popQueue = function() {
	if (queue.length > 0) {
		var next = queue.shift();
	    updateQueue();
	    return next;
	}
	return false;
};

// Put to the back of the queue
var addToQueue = function(vid) {
    queue.push(vid);

    // Autoplay first clicked video
    if (queue.length == 1) {
       playNext();
    }
    
    updateQueue();
    return false;
};

// Update Queue List
var updateQueue = function() {
    // makes sure the queue-display height is updated
    $("#queue-display").css({
        width: $("#rightPanel").width(),
        height: $(window).height() - ($("#playerControls").height() + $("#videoEntry").height())
    });
    
    // update queue list on UI
    var html = "<ul>";
    for (vid in queue) {
        html += "<li";
        if (queuePos == vid) {
            html += " id=\"currentVideo\" ";
        }
        html += ">";
    	html += "<img ";
        html += "src=\"http://img.youtube.com/vi/" + queue[vid] + "/3.jpg\"></a>"; 
        html += "</li>";
    }
    html += "</ul>";
    $("#queue-display").html(html);
    
    // make list scroll with current video
    if (queue.length != 0)
        $("#queue-display").scrollTo("#currentVideo", 800);
    
};

/**
// set click event binding
var setClickBind = function() {
    // intercept all link clicks to recognize clicks to videos

    $("a").click( function(event) {
        var url = $(this).attr('href');
        var results = url.match("[\\?&]v=([^&#]*)");
        
        if (results != null) {        
            event.preventDefault();
            addToQueue(results[1]); // results[1] is the video ID
        }
    });
};
**/

// Video Stop Handler
var onStopCB = function() {
	if (queue.length > 0) {
		playNext();
	}
	else
		currentlyPlaying = false;
};

$(document).ready(function() {
    var leftPanelWidth = $("#leftPanel").width();
    
	// set up player
    jQuery("#player").tubeplayer({
        width: leftPanelWidth,
        height: (leftPanelWidth/4)*3,
    	playerID: "youtube-player", // the ID of the embedded youtube player
        initialVideo: "0GLoHifu6aM",
    	preferredQuality: "default",// preferred quality: default, small, medium, large, hd720
    	onPlay: function(id){currentlyPlaying = true;}, // after the play method is called
    	onPause: function(){currentlyPlaying = false;}, // after the pause method is called
    	onStop: function(){currentlyPlaying = false;}, // after the player is stopped
    	onSeek: function(time){}, // after the video has been seeked to a defined point
    	onMute: function(){}, // after the player is muted
    	onUnMute: function(){}, // after the player is unmuted
    	onPlayerEnded: function(){onStopCB();}
    });

    // get the player reference just in case
    youtubeplayer = jQuery("#player").tubeplayer("player");
    
    // initialize rightPanel
    updateQueue();
    $(window).resize(function(event) {updateQueue()});
    
    // set some form behavior, thanks to 
    $("input, textarea").focus(function(event) {
            this.value = '';
    });
    
    // set search form call handlers
    $("#searchForm").submit(function(event) {
        jQTubeUtil.search({
        	"q": $("#searchTextBox").val(),
        	"time": time,
        	"orderby": orderby,
        	"max-results": 25}, searchCB);
        $("#searchTextBox").autocomplete("close");
        event.preventDefault();
    });
    
    // form that takes url and queues it
    $("#videoEntryForm").submit(function(event) {
    	var url = $("#videoEntryBox").val();
        var results = url.match("[\\?&]v=([^&#]*)");
        
        if (results != null) {        
            addToQueue(results[1]); // results[1] is the video ID
        }
        
        $("#videoEntryBox").val("Enter Youtube URL");
        event.preventDefault();
    });
    
    // if user didn't enter anything put default instructions back
    $("#videoEntryBox").blur(function(event) {
        if (this.value == "")
            this.value = "Enter Youtube URL";
    });
    
    
    $("#searchTextBox").autocomplete(
    	{source:suggestTerm,
    	autoFill: true}
    );
    
    $("#searchTextBox").select();
});