if (window.jobList) {
	window.onload = () => {
		window.jobList.forEach((job) => {
			job();
		});
	};
}
