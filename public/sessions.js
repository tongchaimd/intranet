function begin() {
	const signoutElem = document.querySelector('#signout');
	if (signoutElem) {
		signoutElem.addEventListener('click', () => {
			fetch(new URL('/sessions', window.location.href), {
				method: 'DELETE',
				credentials: 'same-origin',
				redirect: 'follow',
			})
				.then((res) => {
					if (res.ok) return res.text();
					return Promise.reject(new Error(res.statusText));
				})
				.then((link) => {
					window.location.href = link;
				})
				.catch((err) => {
					console.log(err);
				});
		});
	}
}

if (!window.jobList) {
	window.jobList = [];
}
window.jobList.push(begin);
