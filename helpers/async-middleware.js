module.exports = function asyncMiddlewareBuilder(middleware) {
	return function asyncMiddleware(req, res, next) {
		Promise.resolve(middleware(req, res, next))
			.catch(next);
	}
};