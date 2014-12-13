function parsePhase0(s) {
	var out = "";
	
	// Convert currency like "$1,000"  to "$1000"
	for(var i = 0; i < s.length; i++) {
		var ch = s.charAt(i);
		
		if(ch == ',' && i > 0 && (i+1) < s.length) {
			// If we are "surrounded by numbers, simply remove the commas....
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

function getChunks(s) {
	// First pass, convert/handle commas around currency, and various special characters
	s = parsePhase0(s);
	
	// Chunk up the data
	var chunkList = [];
	chunkList = chunker(s, 115);
	return chunkList;
}
				
function chunker(s, max) {
	var chunks = [];
	var l = [];
	l = s.split(/\.\s+|\n|,/);  // Split on: (period, comma, carriage-return)
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
	  		//var smallerChunk = chunk.substr(0, max);
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
	// Cancel any previous feeds--
	var msg = new SpeechSynthesisUtterance('');
	window.speechSynthesis.cancel();
	
	if('speechSynthesis' in window) {
		$("#statusMsg").html("Your browser <strong>supports</strong> speech synthesis.");
	} else {
    $("#statusMsg").html('Sorry your browser <strong>does not support</strong> speech synthesis.<br>Try this in <a href="http://www.google.co.uk/intl/en/chrome/browser/canary.html">Chrome Canary</a>.');
	}
	
	return false;
}

function doInitVoices() {
	var msg = new SpeechSynthesisUtterance();
	var voiceSelect = $("#voice");
	var voices = window.speechSynthesis.getVoices();
	voices.forEach(function (voice, i) {
	 var voiceName = voice.name;
		var option = "<option value='" + voiceName + "'>" + voiceName + "</option>";
		voiceSelect.append(option);
	});
	
	// Default-set to first one...
	msg.voice = voices[0]; // Note: some voices don't support altering params
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
  
	//msg.voiceURI = 'native';
	//msg.volume = 1; // 0 to 1
	
	var rate = parseInt($("#rate").val());
	console.log("Set rate=" + rate);
	msg.rate = rate; // 0.1 to 10
	
	var pitch = parseInt($("#pitch").val());
	console.log("Set pitch=" + pitch);
	msg.pitch = pitch; // 0 to 2
	msg.text = s;
	//msg.lang = 'en-US';
	
	// When speaking is completed, show execution time...{which is not always accurate...}
	msg.onend = function(e) {
	  console.log('elapsedTime=' + e.elapsedTime + ',timeStamp=' + e.timeStamp);
	  console.log('e=' + JSON.stringify(e));
	};
	
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