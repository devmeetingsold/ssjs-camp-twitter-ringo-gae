var response = require('ringo/jsgi/response'),
    mustache = require('ringo/mustache'),
    users = require('./users'),
    utils = require('./utils'),
    {Message, Followed, Mention} = require("./model");

exports.index = function (req) {
    var template = getResource("./templates/index.html").content,
        user = users.current(),
        twiiits = [],
        showForm = false,
        noFollowed = 0,
        followed = [],
        noMentions = 0,
        noFollowers = 0,
        followers = [];
        
    if (user) {
        let userName = user.getNickname();
        twiiits = Message.getUserTimeline(userName);
        followed = Followed.byUser(userName);
        noFollowed = followed.length;
        noMentions = Mention.forUser(userName).count();
        followers = Followed.followersOfUser(userName);
        showForm = true;
    }
    else {
        return response.redirect("/all");
    }
    
         
    return response.html(
        mustache.to_html(template, {
            title: "Welcome to the mighty Twiiit",
            twiiits: twiiits.fetch(50),
            showForm: showForm,
            showAllLink: true,
            noFollowed: noFollowed,
            followed: followed,
            noMentions: noMentions,
            followers: followers, 
            noFollowers: followers.length,
            subtitle: "Your twiiitline",
            login_snippet: users.snippet(req).join("")
        })
    );
};

exports.all = function (req) {
    var template = getResource("./templates/index.html").content,
        twiiits = Message.all().order("-date"),
        showForm = !!users.current();
 
    return response.html(
        mustache.to_html(template, {
            title: "Welcome to the mighty Twiiit",
            twiiits: twiiits.fetch(50),
            showForm : showForm,
            subtitle: "All latest tweets",
            login_snippet: users.snippet(req).join("")
        })
    );
};

exports.mentions = function (req) {
    var template = getResource("./templates/index.html").content,
        user = users.current();
        if (!user){ return response.redirect("/all"); }
        var twiiits = Mention.forUser(user.getNickname())
                      .fetch(50).map(function(x) x.message),
            showForm = false;

    return response.html(
        mustache.to_html(template, {
            title: "Mentions",
            twiiits: twiiits,
            showForm : showForm,
            subtitle: "Twiiits mentioning you",
            login_snippet: users.snippet(req).join("")
        })
    );
};

var checkMentions = function(text, msg) {
  var re  = /@(\S+)/g;
  var match;
  var mention;
  while (match = re.exec(text)) {
    mention = new Mention();
    mention.mentioned = match[1];
    mention.message = msg.key();
  }
  if (mention) { mention.put(); }
}

exports.tweet = function(req) {
    if (req.method == "POST") {
        var values = utils.postParams(req);
        var msg = new Message();
        msg.user = users.current().getNickname();
        msg.text = values.message;
        msg.date = new Date();
        msg.put();
        checkMentions(msg.text, msg);
    }
    return  response.redirect(req.headers.referer || "/");
}

exports.follow = function(req, user) {
    var loggedUser = users.current().getNickname(),
        follow = Followed.all().filter('user =', loggedUser).get();
        
    if (!follow) {
        follow = new Followed();
        follow.user = loggedUser;
        follow.following = [loggedUser]; //follow yourself 
    }
    follow.following.push(user);
    follow.put();
    
    return response.redirect("/");
}

exports.unfollow = function(req, user) {
    var loggedUser = users.current().getNickname();
        follow = Followed.all().filter('user =', loggedUser).get();
        
    follow.following.splice(follow.following.indexOf(user), 1);
    follow.put();
    return response.redirect("/");
}

exports.user = function(req, user) {
    var template = getResource("./templates/index.html").content,
        loggedUser = users.current() && users.current().getNickname(),
        follow = Followed.all().filter('user =', loggedUser).get(),
        twiiits = Message.all().filter('user =', user).order("-date").fetch(50);
    if (follow) { 
        follow = follow.following; 
    }
    var following = (follow || []).indexOf(user) >= 0;
    
    var followed = Followed.byUser(user),
        followers = Followed.followersOfUser(user);
    
    return response.html(
        mustache.to_html(template, {
            title: "Twiiits by " +  user,
            twiiits: twiiits,
            showFollow: loggedUser && !following && loggedUser !== user,
            showUnfollow: following && loggedUser !== user,
            login_snippet: users.snippet(req).join(""),
            username: user,
            subtitle: "Latest tweets by " + user,
            
            followed: followed,
            noFollowed: followed.length,
            followers: followers, 
            noFollowers: followers.length,
        })
    );
}

exports.dummyData = function(req) {
    for (let i = 0; i < 10; i++) {
        var msg = new Message();
        msg.user = "Dummy";
        msg.text = "Hello DevCamp!";
        msg.date = new Date();
        
        msg.put();
    }
    
    var data = Message.all();
    var body = [];
    data.forEach(function(d){
        d = JSON.stringify(d);
        body.push(d);
        body.push(d);
    });
    
    return {
        status: 200,
        headers: {"Content-Type": "text/plain"},
        body: body
    }
}

exports.test = function(req) {
    var data = Message.all().filter('text =', '@rkj');
    var body = ["Test"];
    data.forEach(function(d){
        d = JSON.stringify(d);
        body.push(d);
    });
    
    return {
        status: 200,
        headers: {"Content-Type": "text/plain"},
        body: body
    }

}
