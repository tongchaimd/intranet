/** build title in the template of `{pagename} | {appname}` */
module.exports = function buildTitle(pageName) {
	if (pageName && pageName.trim().length) {
		return `${pageName.trim()} | ${process.env.TITLE}`;
	}
	// no pageName
	return process.env.TITLE;
};
