//var CHUNK_SIZE = 125;
var DEFAULT_CHUNK_SIZE = 125;
var US_CHUNK_SIZE = 1024;

function parsePhase0(s) {
	var out = "";
        s = s.replace(/\u00AD/g, '-');
	
	// Convert currency like "$1,000" to "$1000"
	for(var i = 0; i < s.length; i++) {
		var ch = s.charAt(i);
		if(ch == ',' && i > 0 && (i+1) < s.length) {
			// If we are "surrounded" by numbers, simply remove the commas....
			var prevChar = s.charAt(i-1);
			var nextChar = s.charAt(i+1);
			if(jQuery.isNumeric(prevChar) && jQuery.isNumeric(nextChar)) {
				// "Swallow" the comma....
			} else {
				out += ch;
			}
		} else if(false) {
		} else {
			out += ch;
		}
	}
	return out;
}

function parsePhase1(s) {
	var out = "";
	
  	// Take out URLs
  	var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  	out = s.replace(urlRegex, "{LINK}");
	
	return out;
}

function getChunkSize() {
	var cs = DEFAULT_CHUNK_SIZE;
	var voiceSelect = $("#voice");
	var selectedVoice = null;
	if(voiceSelect) {
		selectedVoice = voiceSelect.val();
		if(selectedVoice == 'native') {
			cs = US_CHUNK_SIZE;
		}
	}
	return cs;
}

function getChunks(s) {
	// First pass, convert/handle commas around currency, and various special characters
	s = parsePhase0(s);
	
	// Second pass, take out URLs, etc
	s = parsePhase1(s);
	
	// Chunk up the data
	var chunkList = [];
	chunkList = chunker(s, getChunkSize());
	return chunkList;
}
				
function chunker(s, max) {
	var chunks = [];
	var l = [];
	//l = s.split(/\.\s+|\n|,/);  // Split on: (period, comma, carriage-return)
	l = s.split(/\n/);  // Split on <CR>
	for(var i = 0; i < l.length; i++) {
		var chunk = l[i];
		if(chunk == '') {
	    	continue;
	  }
	  var siz = chunk.length;
	  if(siz <= max) {
	  	chunks.push(chunk);
	  } else {
	  	while(chunk.length > 0) {
	  		var smallerChunk = subChunker(chunk, max);
	  		chunks.push(smallerChunk);
	  		chunk = chunk.substr(smallerChunk.length);
	  	}
	  }
	}
	return chunks;
}

function subChunker(s, max) {
	var chunk = s.substr(0, max);
	
	if(chunk.charAt(max) == ' ') {  // Lucky...
		return chunk;
	}
	
	// Start 'rewinding' until a space is found{hopefully}
	for(var i = chunk.length; i > 0; i--) {
		if(chunk.charAt(i) == ' ') {	// Stop!
			return chunk.substr(0, i);
		}
	}
	
	// No space found-- last resort have to cut in mid-word
	return chunk;
}

function initSpeech() {
	var msg = new SpeechSynthesisUtterance('');
	window.speechSynthesis.cancel(); // Cancel previous
	
	var smsg = '';
	if('speechSynthesis' in window) {
		smsg = "Your browser <strong>supports</strong> speech synthesis.";
	} else {
    		smsg = 'Sorry your browser <strong>does not support</strong> speech synthesis.<br>Try this in <a href="http://www.google.co.uk/intl/en/chrome/browser/canary.html">Chrome Canary</a>.';
	}
	$("#statusMsg").html(smsg);
	return false;
}

function doInitVoices() {
	var msg = new SpeechSynthesisUtterance();
	var voiceSelect = $("#voice");
	var voices = window.speechSynthesis.getVoices();
	voices.forEach(function (voice, i) {
	 	var voiceName = voice.name;
		var selected = '';
		if(voiceName == 'native') {
			selected = 'selected';
		}
		var option = "<option value='" + voiceName + "' " + selected + " >" + voiceName + "</option>";
		voiceSelect.append(option);
	});
	return false;
}

function doTTS() {
        var taInput = $("#taInput").val();
	var t = taInput.toLowerCase();
	if(t.startsWith("http:") || t.startsWith("https:")) {
		var url = taInput;
		$.blockUI({ 
			css: { 
            			border: 'none', 
            			padding: '15px', 
            			backgroundColor: '#000', 
            			'-webkit-border-radius': '10px', 
            			'-moz-border-radius': '10px', 
            			opacity: .5, 
            			color: '#fff' 
        		},		
			message: "<h3>Processing...</h3>" 
		});
		$.ajax({
		    type: "GET",
		    url: "db.php?url=" + url,
		    success: function (data) {
			$.unblockUI();
			$("#taInput").val(data);
			$("#taInput").attr("rows", "20");
			$("#taInput").css("height", "500px");
			$("#doTTS").click();
		    }
		});
	} else {
		var chunkList = getChunks(taInput);
		chunkList.forEach(function(chunk) {
			doSpeak(chunk);
		});
	}

	return false;
}

function doSpeak(s) {
	var voiceSelect = $("#voice");
	var selectedVoice = null;
	if(voiceSelect) {
		selectedVoice = voiceSelect.val();
	}
	
	var msg = new SpeechSynthesisUtterance();
	
	// If the user had selected a voice, use it...
  	if(selectedVoice) {
		msg.voice = window.speechSynthesis.getVoices().filter(function(voice) {
	  		return voice.name == selectedVoice;
	  	})[0];
	} 
  
	var rate = parseInt($("#rate").val());
	//console.log("Set rate=" + rate);
	msg.rate = rate; // 0.1 to 10
	
	var pitch = parseInt($("#pitch").val());
	//console.log("Set pitch=" + pitch);
	msg.pitch = pitch; // 0 to 2
	msg.text = s;
	
	//msg.onend = function(e) {
	//  console.log('elapsedTime=' + e.elapsedTime + ',timeStamp=' + e.timeStamp);
	//};
	
	// Now speak...
	window.speechSynthesis.speak(msg);
	return false;
}

function doPauseResume() {
	if(pauseResume == 'R') {
		window.speechSynthesis.pause();
		pauseResume = 'P';
	} else if(pauseResume == 'P') {
		window.speechSynthesis.resume();
		pauseResume = 'R';
	} else {
		console.log("Unknown state...");
	}
	return false;
}

function doStop() {
	pauseResume = 'R';
	window.speechSynthesis.cancel();
	return false;
}
