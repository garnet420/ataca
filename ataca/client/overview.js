var displayName = function(user) {
    return "user name 1";
}



Session.set('puzzle_id', null);

//meteor widget for accounts (must configure for external services)
Accounts.ui.config({
    requestPermissions: {
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'//can remove 'optional' and require an email
});

////user stuff

Template.user.userId = function () {
    //returns currently logged in user
    return Meteor.user().username;
}

Template.user.otherUsers = function (){
    //returns other logged in users
    return Meteor.users.find({}, {sort: {username: 1}});
}

///////////puzzles list
Template.puzzles.puzzles = function () {
    return Puzzles.find({}, {sort: {name: 1}});
};

Template.puzzles.events({
    'mousedown .puzzle': function (evt) {
	Router.setPuzzle(this._id);	
    },
    'click .puzzle': function (evt) {
	// prevent clicks on <a> from refreshing the page.
	evt.preventDefault();
    },
})

Template.puzzles.selected = function (){
    return Session.equals('puzzle_id', this.id)? 'selected' : '';
};

Template.puzzles.name_class = function(){
    return this.name ? '' : 'empty';
};

var okCancelEvents = function (selector, callbacks) {
    var ok = callbacks.ok || function () {};
    var cancel = callbacks.cancel || function () {};
    
    var events = {};
    events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
	function (evt) {
	    if (evt.type === "keydown" && evt.which === 27) {
		// escape = cancel
		cancel.call(this, evt);
		
	    } else if (evt.type === "keyup" && evt.which === 13 ||
		       evt.type === "focusout") {
		// blur/return/enter = ok/submit if non-empty
		var value = String(evt.target.value || "");
		if (value)
		    ok.call(this, value, evt);
		else
		    cancel.call(this, evt);
	    }
	};
    return events;
};

Template.puzzles.events(okCancelEvents(
    '#new-puzzle',
    {
	ok: function (text, evt) {
	    var id = Puzzles.insert({name: text, contents: "Edit puzzle here"});
	    Router.setPuzzle(id);
	    //remove focus from new puzzle box?
	    evt.target.value = "";
	}
    }));

