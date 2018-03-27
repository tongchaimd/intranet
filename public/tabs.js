function begin() {
	const tabsList = document.querySelectorAll('.tabs');
	tabsList.forEach((tabs) => {
		const group = tabs.dataset.group;
		if(group) {
			const ul = tabs.querySelector('ul');
			ul.childNodes.forEach((li) => {
				li.addEventListener('click', (e) => {
					e.stopPropagation();
					e.preventDefault();

					ul.childNodes.forEach((child) => {
						child.classList.remove('is-active');
					})
					li.classList.add('is-active');

					// Hide every divs in group
					const divList = document.querySelectorAll(`div.group-${group}`)
					divList.forEach((div) => {
						div.classList.add('is-hidden');
					});
					// Show target div
					const target = li.dataset.target;
					const targetDiv = document.querySelector(`div.group-${group}.target-${target}`);
					targetDiv.classList.remove('is-hidden');
				});
			});
		}
	});
}

if (!window.jobList) {
	window.jobList = [];
}
window.jobList.push(begin);
