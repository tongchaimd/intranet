function begin() {
	const superQueryList = document.querySelectorAll('.super-query');
	superQueryList.forEach((elem) => {
		elem.addEventListener('click', onClickSuperQuery);
	})
}

function onClickSuperQuery(e) {
	e.preventDefault();
	e.stopPropagation();

	const target = this.dataset.target;
	const body = this.dataset.body;
	const method = this.dataset.method;

	fetch(target, {
		method,
		body,
		credentials: 'same-origin',
		headers: {
			'content-type': 'application/json',
		},
	})
		.then((res) => {
			if (res.ok) {
				window.location.href = window.location.href;
			} else {
				throw Error(res);
			}
		})
		.catch((err) => {
			console.log(err);
		});
}

if (!window.jobList) {
	window.jobList = [];
}
window.jobList.push(begin);
