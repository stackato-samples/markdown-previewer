(function() {
	var DROP_AREA = 'dropArea';
	var RENDERING_AREA = 'renderingArea';
	var FILENAME_LABEL = 'filenameLabel';
	var LAST_MODIFIED_LABEL = 'lastModifiedLabel';
	var README = 'READMEmd';
	var MONITORING_INTERVAL_MILLIS = 250;
	var isFx = !(window.sidebar === undefined);

	var converter = null;
	var renderingArea = null;
	var dropArea = null;
	var htmlSourceArea = null;
	var lastModifiedLabel = null;
	var clip = null;

	window.addEventListener("load", function() {
		converter = new Showdown.converter();

		clip = new ZeroClipboard(document.getElementById("copyHtml"), {
			moviePath: "swf/ZeroClipboard.swf"
		});
		clip.on('mousedown', function(client) {
			clip.setText(getInnerText(htmlSourceArea));
		});

		dropArea = document.getElementById(DROP_AREA);
		dropArea.addEventListener("drop", onDrop, false);
		dropArea.addEventListener("dragover", function(ev) { ev.preventDefault(); }, false);

		htmlSourceArea = document.getElementById("htmlSourceArea");

		renderingArea = document.getElementById(RENDERING_AREA);
		render(document.getElementById(README).value);

		$("#tab_preview").click(function() {
			$("#view_html").removeClass("active");
			$("#view_preview").addClass("active");
			$("#renderingArea").css("display", "block");
			$("#htmlArea").css("display", "none");
		});
		$("#tab_html").click(function() {
			$("#view_html").addClass("active");
			$("#view_preview").removeClass("active");
			$("#renderingArea").css("display", "none");
			$("#htmlArea").css("display", "block");
		});

	}, false);

	var fileUpdationDetector = {
		tid: null,
		stopMonitoring: function() {
			if (!fileUpdationDetector.tid) {
				clearInterval(fileUpdationDetector.tid);
				fileUpdationDetector.tid = null;
			}
		}
	};

	if (isFx) {
		fileUpdationDetector.startMonitoring = function(file) {
			var lastHashValue = null;

			fileUpdationDetector.tid = setInterval(function() {
				readFile(file, function(text) {
					var hashValue = 0;
					for (var i = 0; i < text.length; i++) {
						hashValue = hashValue * 31 + text.charCodeAt(i);
						hashValue &= hashValue;
					}

					if (hashValue == lastHashValue) {
						return;
					}

					if (lastHashValue != null) {
						render(text, new Date());
					}

					lastHashValue = hashValue;
				});
				
			}, MONITORING_INTERVAL_MILLIS * 3);
		};

	} else {
		fileUpdationDetector.startMonitoring = function(file) {
			var lastModifiedTime = file.lastModifiedDate.getTime();

			fileUpdationDetector.tid = setInterval(function() {
				if (file.lastModifiedDate.getTime() == lastModifiedTime) {
					return;
				}

				lastModifiedTime = file.lastModifiedDate.getTime();
				updatePreview(file);
			
			}, MONITORING_INTERVAL_MILLIS);
		};
	}

	function setInnerText(obj, text) {
		isFx ? (obj.textContent = text) : (obj.innerText = text);
	}

	function getInnerText(obj) {
		return isFx ? obj.textContent : obj.innerText;
	}

	function onDrop(ev) {
		var file = ev.dataTransfer.files[0];
		if (file.name.match(/\.rdoc$/)) {
			converter = new Attacklab.rundown.converter();
		}

		dropArea.style.display = 'none';

		setInnerText(document.getElementById(FILENAME_LABEL), file.name);
		lastModifiedLabel = document.getElementById(LAST_MODIFIED_LABEL);

		updatePreview(file);
		fileUpdationDetector.stopMonitoring();
		fileUpdationDetector.startMonitoring(file);

		ev.preventDefault();
	}

	var currentTimerId = null;

	function readFile(file, callback) {
		var reader = new FileReader();
		reader.onload = function() {
			callback(reader.result);
		};
		reader.readAsText(file);
	}

	function updatePreview(file) {
		readFile(file, function(text) { render(text, file.lastModifiedDate); });
	}


	function render(text, date) {
		var html = converter.makeHtml(text);
		renderingArea.innerHTML = html;
		setInnerText(htmlSourceArea, html);

		if (date) {
			setInnerText(lastModifiedLabel, date.toLocaleString());
		}

		var $headerList = $('#headerList');
		$headerList.empty();

		var $headers = $('#renderingArea > h1, #renderingArea > h2, #renderingArea > h3, #renderingArea > h4, #renderingArea > h5, #renderingArea > h6');
		for (var i = 0; i < $headers.length; i++) {
			var h = $headers[i];
			var anchor = $('<a/>', { href: "#" + h.id, text: getInnerText(h) });
			$headerList.append($('<li/>').append(anchor));
		}
	}
})();
