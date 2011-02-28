/* Display albums by the specified band */
function listAlbums(band) {
    // Find the document elements we need to insert content into
    var title = document.getElementById("title");
    var albumlist = document.getElementById("albumlist");
    var tracklist = document.getElementById("tracklist");

    title.innerHTML = "Albums by " + band;           // Set the page title 
    albumlist.innerHTML = "<b><i>Loading...</i></b>" // Album list is coming...
    tracklist.style.visibility = "hidden";           // Hide any old tracks
    
    var query = {                      // This is our MQL query 
        type: "/music/artist",         // Find a band
        name: band,                    // With the specified name
        album: [{                      // We want to know about albums         
            name:null,                 // Return album names
            id:null,                   // Also ids
            release_date:null,         // And release dates
            sort: "release_date",      // Order by release date
            "release_type!=":"single"  // Don't include singles
        }]
    };

    // Issue the query and invoke the function below when it is done
    Metaweb.read(query, displayAlbums);

    // This function is invoked when we get the result of our MQL query
    function displayAlbums(result) {  
        // If no result, the band was unknown.
        if (!result || !result.album) {
            albumlist.innerHTML = "<b><i>Unknown band: " + band + "</i></b>";
            return;
        }
        
        // Otherwise, the result object matches our query object, 
        // but has album data filled in.  
        var albums = result.album;  // the array of album data
        // Erase the "Loading..." message we displayed earlier
        albumlist.innerHTML = "";
        // Loop through the albums
        for(var i = 0; i < albums.length; i++) {
            var name = albums[i].name;                   // album name 
            var year = getYear(albums[i].release_date);  // album release year
            var text = name + (year?(" ["+year+"]"):""); // name+year

            // Create HTML elements to display the album name and year.
            var div = document.createElement("div");
            div.className = "album";
            div.appendChild(document.createTextNode(text));
            albumlist.appendChild(div);

            // Add an event handler to display tracks when an album is clicked
            div.onclick = makeHandler(name, albums[i].id);
        }

        // This function returns a function.  We do it this way to create
        // a closure that captures the band name and id.
        function makeHandler(name, id) {
            return function(e) { listTracks(name, id); }
        }
    }

    // A utility to return the year portion of a Metaweb /type/datetime
    function getYear(date) {
        if (!date) return null;
        if (date.length == 4) return date;
        if (date.match(/^\d{4}-/)) return date.substring(0,4);
        return null;
    }
}

/* Display the tracks on the specified album by the specified band */
function listTracks(albumname, albumid) {
    // Begin by displaying a Loading... message
    var tracklist = document.getElementById("tracklist");
    tracklist.innerHTML = "<h2>" + albumname + "</h2><p>Loading...";
    tracklist.style.visibility = "visible";

    // This is the MQL query we will issue
    var query = {
        type: "/music/album",
        id: albumid,
        // Get track names and lengths, sorted by index
        track: [{name:null, length:null, index:null, sort:"index"}]
    };

    // Issue the query, invoke the nested function when the response arrives
    Metaweb.read(query, function(result) {
                     if (result && result.track) { // If result is defined
                         var tracks = result.track;  // array of tracks
                         // Build an array of track names + lengths
                         var listitems = [];
                         for(var i = 0; i < tracks.length; i++) {
                             var n = tracks[i].name + " (" +
                               toMinutesAndSeconds(tracks[i].length) + ")";
                             listitems.push(n);
                         }
                         // Display the track list by setting innerHTML
                         tracklist.innerHTML = "<h2>" + albumname + "</h2>" +
                             "<ol><li>" + listitems.join("<li>") + "</ol>";
                     }
                     else {
                         // If empty result display error message
                         tracklist.innerHTML = "<h2>" + albumname + "</h2>" +
                             "<p>No track list is available.";
                     }
                 });

    // Convert track length in seconds to minutes:seconds format
    function toMinutesAndSeconds(seconds) {
        var minutes = Math.floor(seconds/60);
        var seconds = Math.floor(seconds-(minutes*60));
        if (seconds <= 9) seconds = "0" + seconds;
        return minutes + ":" + seconds;
    }
};

(function ($) {
  //alert( 'DOM\'s Ready :' + typeof jQuery +'\nMetaweb :' + typeof Metaweb);
  
  $('#submit').click(function(e) {
    e.preventDefault();
    
    var keyword = $('#keyword').val();
    alert(keyword);
    listAlbums(keyword);
  });  
  
})(jQuery);