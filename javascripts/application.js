var fm    = window.fm || {};
fm.data   = function () {};
fm.graph  = function () {};
fm.utils  = function () {
  this.USER_AGENT       = navigator.userAgent;
  this.MOBILE_DEVICES   = this.USER_AGENT.match(/iPhone/i) || this.USER_AGENT.match(/iPad/i);
  this.CANVAS           = typeof HTMLCanvasElement;
  this.CANVAS_SUPPORTED = this.CANVAS == 'object' || this.CANVAS == 'function'; 
  this.CANVAS_CONTEXT   = typeof document.createElement('canvas').getContext('2d').fillText == 'function';
  this.CANVAS_TEXT      = this.CANVAS_SUPPORTED && this.CANVAS_CONTEXT;
  this.LABEL            = !this.CANVAS_SUPPORTED || (this.CANVAS_TEXT && !this.MOBILE_DEVICES) ? 'Native' : 'HTML';
  this.GRADIENT         = this.CANVAS_SUPPORTED;
  this.ANIMATED         = !this.MOBILE_DEVICES || !this.CANVAS_SUPPORTED;
  this.LOG = function () {
    return {
      elem: false,
      write: function(text) {
        if (!this.elem) this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
      }
    }
  }
};

fm.notification = {
  container: $('<div/>', {'id':'notification'}),
  properties: {}
};

fm.data.prototype.renderJSON = function (data) {
  // Manually converted to JSON type for $jit   
  var secondLayer = [];
  $.each(data, function(i, item) {
    var releases = item.releases;
    var list = {
      id: item.id,
      name: item.name,
      children: []
    };
    $.each(releases, function(i, track) {
      $.each(track, function(i, trackData) {
        var thirdLayer = [];
        $.each(trackData, function(i, value) {
          var thirdLayerChildren = {
            id : value["canonical:id"],
            name : value["name"],
            children: []
          }
          thirdLayer.push(thirdLayerChildren)
        });
        list.children = thirdLayer;
      });
    });
    secondLayer.push(list);
  });
  
  var firstLayer = {
    id: '1',
    name: 'Albums by: ',
    children: secondLayer
  };
  
  return firstLayer;
}

fm.graph.prototype.rGraph = function(data) {
  var utils = new fm.utils();
  //init RGraph
  var rgraph = new $jit.RGraph({
      //Where to append the visualization
      injectInto: 'infovis',
      //Optional: create a background canvas that plots
      //concentric circles.
      background: {
        CanvasStyles: {
          strokeStyle: '#555'
        }
      },
      
      levelDistance : 200,
      //Add navigation capabilities:
      //zooming by scrolling and panning.
      Navigation: {
        enable: true,
        panning: true,
        zooming: 15
      },
      //Set Node and Edge styles.
      Node: {
          color: '#ddeeff'
      },

      Edge: {
        color: '#C17878',
        lineWidth:1.5
      },

      onBeforeCompute: function(node){
          console.log("centering " + node.name + "...");
          //Add the relation list in the right column.
          //This list is taken from the data property of each JSON node.
          //$jit.id('inner-details').innerHTML = node.data.relation;
      },

      onAfterCompute: function(){
          console.log("done");
      },
      //Add the name of the node in the correponding label
      //and a click handler to move the graph.
      //This method is called once, on label creation.
      onCreateLabel: function(domElement, node){
          domElement.innerHTML = node.name;
          domElement.onclick = function(){
              rgraph.onClick(node.id);
              rgraph.rotate(node, utils.ANIMATED ? 'animate' : 'replot', {
                duration: 1000,
                transition: $jit.Trans.Quart.easeInOut
              });

          };
      },
      //Change some label dom properties.
      //This method is called each time a label is plotted.
      onPlaceLabel: function(domElement, node){
          var style = domElement.style;
          style.display = '';
          style.cursor = 'pointer';

          if (node._depth <= 1) {
              style.fontSize = "0.8em";
              style.color = "#ccc";

          } else if(node._depth == 2){
              style.fontSize = "0.7em";
              style.color = "#494949";

          } else {
              style.display = 'none';
          }

          var left = parseInt(style.left);
          var w = domElement.offsetWidth;
          style.left = (left - w / 2) + 'px';
      }
  });
  //load JSON data
  rgraph.loadJSON(data);
  //trigger small animation
  rgraph.graph.eachNode(function(n) {
    var pos = n.getPos();
    pos.setc(-100, -100);
  });
  rgraph.compute('end');
  rgraph.fx.animate({
    modes:['polar'],
    duration: 2000
  });
  //end
  //append information about the root relations in the right column
  //jit.id('inner-details').innerHTML = rgraph.graph.getNode(rgraph.root).data.relation;
};

fm.graph.prototype.sunburst = function(data) {
  //init Sunburst
  var utils = new fm.utils();
  var sb = new $jit.Sunburst({
      //id container for the visualization
      injectInto: 'infovis',
      //Distance between levels
      levelDistance: 200,
      //Change node and edge styles such as
      //color, width and dimensions.
      Node: {
        overridable: true,
        type: fm.utils.GRADIENT ? 'gradient-multipie' : 'multipie'
      },
      //Select canvas labels
      //'HTML', 'SVG' and 'Native' are possible options
      Label: {
        type: utils.LABEL ? 'SVG' : 'HTML'
      },
      //Change styles when hovering and clicking nodes
      NodeStyles: {
        enable: true,
        type: 'Native',
        stylesClick: {
          'color': '#33dddd'
        },
        stylesHover: {
          'color': '#dd3333'
        }
      },
      //Add tooltips
      Tips: {
        enable: true,
        onShow: function(tip, node) {
          var html = "<div class=\"tip-title\">" + node.name + "</div>"; 
          tip.innerHTML = html;
        }
      },
      //implement event handlers
      Events: {
        enable: true,
        onClick: function(node) {
          if(!node) return;
          //hide tip
          sb.tips.hide();
          //rotate
          sb.rotate(node, utils.ANIMATED ? 'animate' : 'replot', {
            duration: 1000,
            transition: $jit.Trans.Quart.easeInOut
          });
        }
      },
      // Only used when Label type is 'HTML' or 'SVG'
      // Add text to the labels. 
      // This method is only triggered on label creation
      onCreateLabel: function(domElement, node){
        var labels = sb.config.Label.type;
        if (labels === 'HTML') {
          domElement.innerHTML = node.name;
        } else if (labels === 'SVG') {
          domElement.firstChild.appendChild(document.createTextNode(node.name));
        }
      },
      // Only used when Label type is 'HTML' or 'SVG'
      // Change node styles when labels are placed
      // or moved.
      onPlaceLabel: function(domElement, node){
        var labels = sb.config.Label.type;
        if (labels === 'SVG') {
          var fch = domElement.firstChild;
          var style = fch.style;
          style.display = '';
          style.cursor = 'pointer';
          style.fontSize = "0.8em";
          fch.setAttribute('fill', "#444");
        } else if (labels === 'HTML') {
          var style = domElement.style;
          style.display = '';
          style.cursor = 'pointer';
          style.fontSize = "0.8em";
          style.color = "#666";
          var left = parseInt(style.left);
          var w = domElement.offsetWidth;
          style.left = (left - w / 2) + 'px';
        }
      }
 });
  //load JSON data.
  sb.loadJSON(data);
  //compute positions and plot.
  sb.refresh();
  //end
}


/* Display albums by the specified band */
function sendQuery(band) {
    var query = {                      // This is our MQL query 
        type: "/music/artist",         // Find a band
        name: band,                    // With the specified name
        album: [{                      // We want to know about albums         
            name:null,                 // Return album names
            id:null,                   // Also ids
            release_date:null,         // And release dates
            sort: "release_date",      // Order by release date
            "release_type!=":"single", // Don't include singles
            "releases": [{
                "limit": 10,
                "track": [{
                "canonical:id": null,
                "name":         null,
                "song": [{
                  "optional":     true,
                  "canonical:id": null
                }]
              }]
            }]
        }]
    };

    // Issue the query and invoke the function below when it is done
    Metaweb.read(query, renderGraph);
    
    function renderGraph(result) {
        if (typeof $jit === 'function') {
          // If no result, the band was unknown.
          if (!result || !result.album) {
              fm.notification.container.html("<b><i>Unknown band: " + band + "</i></b>");
              fm.notification.container.appendTo($('#settings'));
              fm.notification.addClass('highlights');
              return;
          }
          // Otherwise, the result object matches our query object, 
          // but has album data filled in.  
          var albums = result.album;
          var _data = new fm.data();
          var _graph = new fm.graph();
          var _type = $('#visual').val();
          switch (_type) {
            case 'rgraph':
              _graph.rGraph(_data.renderJSON(albums));
              break;
            case 'sunburst':
              _graph.sunburst(_data.renderJSON(albums));
              break;
            default: 
              fm.notification.container.html("<b><i>Please select visualization type</i></b>");
              fm.notification.container.appendTo($('#settings'));
              break;
          }
        }  
    }
    
    function renderList(result) {
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
          var songName = '';
          
          // Create HTML elements to display the album name and year.
          var album = $('<div/>', {'class':'album', html:'<h2>' + name + '</h2> (' + year + ')'});
          var albumTracks = $('<ul/>', {'class':'album-tracks'});
          
          var trackLength = albums[i].releases;
          
          $.each(trackLength, function(i, value) {
            $.each(value.track, function(k, value) {
              if (value.name != songName) {
                songName = value.name;
                var _list = '<li>' + songName + '</li>';
                albumTracks.append(_list);
              }
            });
          });
          
          $('#albumlist').append(album).andSelf().append(albumTracks);
          
          $('.album-tracks li').css('cursor', 'pointer').andSelf().bind('click', renderGraph);
          
          // Add an event handler to display tracks when an album is clicked
          //div.onclick = makeHandler(name, albums[i].id);
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
  var utils = new fm.utils();
  
  var graphContainer = $('#center-container');
  var graph = $('#infovis');
  var keyword = '';
  
  $('#keyword')
  .suggest({
    type: '/music/artist',
    soft: true
  })
  .bind('fb-select', function(e, data) {
    keyword = data.name;
    if (keyword != null) {
      graph.html('');
      sendQuery(keyword);
    }
  })
  .bind('keydown', function(e){
    if (keyword != null) {
      graph.html('');
      sendQuery(keyword);
    }
  });
  
  $('#visual, #keyword').bind('change', function(e) {
    if (fm.notification.container.length) fm.notification.container.remove();
    if (keyword != null) {
      graph.html('');
      sendQuery(keyword);
    }
  });
  
  $(graphContainer, graph).each(function () {
    $(this).css({
      'width': $(window).width(),
      'height': $(window).height() - $('#search').height(),
      'left': 0,
      'top': 0
    });
  });
  
  $('#submit').click(function(e) {
    e.preventDefault();
    graph.html('');
    if (keyword != null)
      sendQuery(keyword);
  })
  .hide();  
  
})(jQuery);