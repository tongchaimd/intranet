/**
	* replace calling element with target box when user starts
	* dragging file(s) and call callback when user drop file(s) on
	* target with arguments of file(s)
	* text parameter will be displayed in target box
	* @todo refactor to be more atomic
  * @param {string} text - will be displayed in target box
  * @param {Function} callback - will be called with files that user drop
  */
Node.prototype.addFileDroppingListener = function addFileDroppingListener(text, callback) {
	const elem = this;
	let dragging = false;
	let timeout;
	const parent = elem.parentNode;
	const height = elem.offsetHeight;
	const width = elem.offsetWidth;
	const dropTarget = document.createElement('div');
	dropTarget.style.height = `${height} px`;
	dropTarget.style.width = `${width} px`;
	dropTarget.className = 'drop-target';
	dropTarget.textContent = text;

	function stoppedDragging() {
		if (dragging) {
			parent.replaceChild(elem, dropTarget);
		}
		dragging = false;
	}

	function startDragging() {
		if (!dragging) {
			parent.replaceChild(dropTarget, elem);
		}
		dragging = true;
	}

	document.body.addEventListener('dragover', (event) => {
		event.stopPropagation();
		event.preventDefault();
		startDragging();
		clearTimeout(timeout);
	});
	document.body.addEventListener('dragleave', (event) => {
		event.stopPropagation();
		event.preventDefault();
		// won't consider dragging stopped unless 'dragover' doesn't fire in 50 ms
		timeout = setTimeout(stoppedDragging, 50);
	});
	document.body.addEventListener('drop', (event) => {
		event.stopPropagation();
		event.preventDefault();
		stoppedDragging();
		if (event.target === dropTarget) {
			callback.call(elem, null, event.dataTransfer.files);
		}
	});
};
