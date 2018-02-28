import mammoth from './mammoth.browser.js';
import addFileDroppingListener from './dragdrop.js';

function readWordAsHtml(file) {
	const reader = new FileReader();
	return reader.pReadAsArrayBuffer(file)
		.then(content => mammoth.convertToHtml({ arrayBuffer: content }))
		.then(result => result.value);
}

// wrap promise around built-in method
FileReader.prototype.pReadAsArrayBuffer = function pReadAsArrayBuffer(arg) {
	return new Promise((resolve) => {
		this.readAsArrayBuffer(arg);
		this.addEventListener('loadend', () => {
			resolve(this.result);
		});
	});
};

function htmlToNews(html) {
	const news = {};
	const container = document.createElement('div');
	container.innerHTML = html;

	news.imageSourceArray = [];
	const imageElems = container.getElementsByTagName('img');
	for (let i = imageElems.length - 1; i >= 0; i -= 1) {
		const imageElem = imageElems[i];
		news.imageSourceArray.push(imageElem.src);
		imageElem.parentNode.removeChild(imageElem);
	}

	while (!news.title || !news.title.trim()) {
		const titleElem = container.querySelector('p, h1');
		news.title = titleElem.textContent;
		titleElem.parentNode.removeChild(titleElem);
	}

	const urlRegex = /(?:http(?:s)?:\/\/.)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_+.~#?&//=]*)/;
	const urlMatches = container.innerHTML.match(urlRegex);
	if (urlMatches && urlMatches.length) {
		news.sourceUrl = urlMatches[urlMatches.length - 1];
	}

	news.markedupContent = container.innerHTML;

	return news;
}

// expectations: use bulma structures, 'this' == .file-label
function onFilesSelect(err, files) {
	const dropTarget = this;

	// acceptable MIME types
	const wordTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

	// validates files argument
	if (!files || !files.length) {
		return null;
	}
	const file = files[0];
	if (!wordTypes.includes(file.type)) {
		dropTarget.parentNode.classList.add('is-danger');
		setTimeout(() => { dropTarget.parentNode.classList.remove('is-danger'); }, 1000);
		return null;
	}

	// set element filename
	const fileName = this.parentNode.querySelector('.file-name>span');
	fileName.textContent = file.name;

	// container to show preview or errors on
	const previewContainer = document.querySelector('.justadiv');
	readWordAsHtml(file)
		.then((html) => {
			const news = htmlToNews(html);
			if (!news.title) {
				return Promise.reject(new Error('Couldn\'t find title in the document!'));
			}
			if (!news.markedupContent) {
				return Promise.reject(new Error('Couldn\'t find content in the document'));
			}

			// update source url input
			const sourceUrlInputElem = document.querySelector('input[name="sourceUrl"]');
			sourceUrlInputElem.value = news.sourceUrl || '';

			previewContainer.textContent = 'Loading...';
			return fetch(new URL('/news/preview', window.location.href), {
				method: 'POST',
				body: JSON.stringify(news),
				headers: {
					'content-type': 'application/json',
				},
				credentials: 'same-origin',
			});
		})
		.then((res) => {
			if (res.ok) {
				return res.text();
			} else if (res.status === 400) {
				return Promise.reject(new Error('Something\'s wrong with the document'));
			}
			return Promise.reject(new Error('Something\'s wrong'));
		})
		.then((text) => {
			previewContainer.innerHTML = text;
		})
		.catch((error) => {
			previewContainer.textContent = error;
		});
}

function updatePreviewSource(newValue) {
	const previewSourceElem = document.querySelector('#preview-source');
	if (previewSourceElem.classList.contains('is-hidden') && newValue) {
		previewSourceElem.classList.remove('is-hidden');
	} else if (!previewSourceElem.classList.contains('is-hidden') && !newValue) {
		previewSourceElem.classList.add('is-hidden');
	}
	const sourceUrlElem = previewSourceElem.querySelector('a');
	sourceUrlElem.text = newValue;
	sourceUrlElem.href = newValue;
}

function begin() {
	const fileLabelElem = document.querySelector('.file-label');

	addFileDroppingListener(fileLabelElem, 'News', onFilesSelect.bind(fileLabelElem));

	const fileInputElem = document.querySelector('.file-input');
	fileInputElem.addEventListener('change', () => { onFilesSelect.call(fileInputElem.parentNode, null, fileInputElem.files); });

	const sourceUrlInputElem = document.querySelector('input[name="sourceUrl"]');
	sourceUrlInputElem.addEventListener('input', () => {
		updatePreviewSource(sourceUrlInputElem.value.trim());
	});
}

window.onload = begin;
