function begin() {
	const addInputElemList = document.querySelectorAll('.add-input');
	addInputElemList.forEach((addInputElem) => {
		addInputElem.addEventListener('click', addInput.bind(null, addInputElem));
	});
}

function addInput(addInputElem) {
	const field = document.createElement('div');
	field.className = 'field';
	field.innerHTML = `<div class="control"><input class="input" type="text" name="${addInputElem.dataset.inputName}"></div>`;
	addInputElem.parentNode.insertBefore(field, addInputElem);
}

if (!window.jobList) {
	window.jobList = [];
}
window.jobList.push(begin);
