var db = require("google/appengine/ext/db");

var Message = exports.Message = db.Model("Message", {
    date: new db.DateProperty(),
    
    user: new db.StringProperty(),
    text: new db.StringProperty()
});

Message.getUserTimeline = function(userName) {
    var twiiits = Message.all().order("-date"),
        f = Followed.all().filter("user = ", userName).get();
        
    if (f && f.following.length > 0) {
        twiiits = twiiits.filter("user IN ", f.following);
    } else {
      twiiits = twiiits.filter("user = ", userName);
    }
    return twiiits;
}

var Followed = exports.Followed = db.Model("Followed", {
    user: new db.StringProperty(),
    following: new db.StringListProperty()
});


Followed.byUser = function(userName) {
    var followed = [], 
        f = Followed.all().filter("user = ", userName).get();
    
    if (f && f.following.length > 0) {
        followed = f.following.filter(function(el) {
            return el !== userName;
        });
    }
    
    return followed;
}

Followed.followersOfUser = function(userName) {
    var followers = Followed.all().filter("following = ", userName).fetch();
    followers = followers.filter(function(el) {
        return el.user !== userName;
    }).map(function(el) {
        return el.user;
    });
    
    return followers;
}

var Mention = exports.Mention = db.Model("Mention", {
    mentioned: new db.StringProperty(),
    message: db.ReferenceProperty("Message")
});

Mention.forUser = function(userName) {
    return Mention.all().filter("mentioned = ", userName);
}

