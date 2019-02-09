var fail = false;
var expectedChunks = 0;
var totChunks = 0;
var nowPlaying = false;
var audQueue = [];
var myInterval = 0;
var pollyHost = '45.55.71.115';
var wsUrl = 'http://' + pollyHost + ':9998/tts';
function startLoop() {
        if(myInterval > 0) clearInterval(myInterval);
        myInterval = setInterval( "doSomething()", 1000);
}
async function doSomething() {
        if(fail == true) {
                console.log("failure...");
                nowPlaying = false;
                audQueue = [];
                expectedChunks = 0;
                totChunks = 0;
                return false;
        }
        if(!nowPlaying && audQueue.length == 0 && totChunks > audQueue.length) {
                console.log("done reading....");
        } else {
        if(nowPlaying) {
                console.log("queue size: " + audQueue.length + ", chunks: " + totChunks);
        }
        if(audQueue.length > 0 && !nowPlaying && expectedChunks == totChunks) {
                var aud = audQueue.shift();
                if(!aud) {
                        console.log("aud is blank...");
                        return false;
                }
                console.log("popped off: " + aud + ", remain: " + audQueue.length);
                audioCtrl.src = aud;
                nowPlaying = true;
        }
        }
}
startLoop();

async function doTTS() {
        fail = false;
        prevTaVal = "";
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
                audQueue = [];
                expectedChunks = 0;
                totChunks = 0;
                var audioCtrl = $("#audioCtrl")[0];
                audioCtrl.addEventListener('ended', async function(e) {
                        console.log("audio chunk completed...");
                        await sleep(2000);
                        nowPlaying = false;
                        return false;
                });
                var taInput = $("#taInput").val();
                var chunkList = [];
                var sequence = 0;
                chunkList = chunker(taInput, 1500);
                var echunks = chunkList.length;
                expectedChunks = echunks;
                for(var i = 0; i < echunks; i++) {
                        var s = chunkList[i];
                        console.log("i: " + i + ", chunk size: " + s.length);
                        enqueueAudio(s, i);
                        await sleep(2);
                }
        }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enqueueAudio(txt, sequence) {
        //var gotResponse = false;
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(blob) {
            if (xhr.status == 200) {
                var aud = window.URL.createObjectURL(xhr.response);
                console.log("audio acquired: " + aud + ", sequence: " + sequence);
                audQueue[sequence] = aud;
                totChunks++;
            } else {
                console.log("failure...");
                fail = true;
            }
        });
        xhr.open('POST', wsUrl);
        xhr.responseType = 'blob';
        var params = JSON.stringify({text: txt});
        xhr.send(params);
        return false;
};


function acquireVoice(txt) {
        var audioCtrl = $("#audioCtrl")[0];
        var xhr = new XMLHttpRequest();
        xhr.addEventListener('load', function(blob) {
            if (xhr.status == 200) {
                audioCtrl.src = window.URL.createObjectURL(xhr.response);
                console.log("audio acquired...");
            }
        });
        xhr.open('POST', wsUrl);
        xhr.responseType = 'blob';
        var params = JSON.stringify({text: txt});
        xhr.send(params);
        return false;
};

function chunker(s, max) {
        var chunks = [];
        var chunk = s;
  while(chunk.length > 0) {
        var smallerChunk = subChunker(chunk, max);
        chunks.push(smallerChunk);
        chunk = chunk.substr(smallerChunk.length);
  }
        return chunks;
}

function subChunker(s, max) {
        if(s.length <= max) {
                return s;
        }
        var chunk = s.substr(0, max);
        if(chunk.charAt(max) == ' ') {
                return chunk;
        }
        for(var i = chunk.length; i > 0; i--) {
                if(chunk.charAt(i) == ' ') {
                        return chunk.substr(0, i);
                }
        }
        return chunk;
}

function doPauseResume() {
        if(pauseResume == 'R') {
                $("#audioCtrl")[0].pause();
                pauseResume = 'P';
        } else if(pauseResume == 'P') {
                $("#audioCtrl")[0].play();
                pauseResume = 'R';
        } else {
                console.log("Unknown state...");
        }
        return false;
}

function doStop() {
        pauseResume = 'R';
        $("#audioCtrl")[0].pause();
        audQueue = [];
        expectedChunks = 0;
        totChunks = 0;
        nowPlaying = false;
        return false;
}


function doClear() {
        prevTaVal = "";
        $("#taInput").val("");
        return false;
}
