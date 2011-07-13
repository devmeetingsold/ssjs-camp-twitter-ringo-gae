
var UserServiceFactory = Packages.com.google.appengine.api.users.UserServiceFactory;
exports.current = function() {
  var us = UserServiceFactory.getUserService();
  if (us.isUserLoggedIn()) {
    return us.getCurrentUser();
  }
  return null;
}

exports.snippet = function(req, url) {
  var user = exports.current();
  var service = UserServiceFactory.getUserService();
  url = url || 'http://' + req.headers.host + req.pathInfo;
  var body = [];
  if (user) {
    body.push(user.getNickname());
    body.push(" | <a href=\"");
    body.push(service.createLogoutURL(url));
    body.push("\">Sign out</a>");
  } else {
    body.push("<a href=\"")
    body.push(service.createLoginURL(url))
    body.push("\">Login</a>")
  }
  return body;
}

exports.handler = function(req) {
  return {
    status: 200,
    headers: {"Content-Type": "text/html"},
    body: exports.snippet(req)
  }
}

