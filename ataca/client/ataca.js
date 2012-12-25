//lists of users with permission to view a puzzle
//something fades back to "unclicked" color slowly over time

//users

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

///////////current puzzle panel

Template.current_puzzle.any_puzzle_selected = function(){
    //checks for invalid puzzle id in session (due to server re-populating the puzzle database as well as for whether a puzzle has been selected.
    if (Session.get('puzzle_id')==null){
	return false
    }
    var url_puzzle = Session.get('puzzle_id');
    if (Puzzles.findOne(url_puzzle)){
	return true;
    }
    else{
	return false;
    }
}

Template.current_puzzle.current_puzzle = function(){
    var current_puzzle_id = Session.get('puzzle_id');
    return Puzzles.findOne(current_puzzle_id).contents;
}

//////Backbone for tracking puzzle in URL
var PuzzleRouter = Backbone.Router.extend({
    routes: {
	":puzzle_id": "main"
    },
    main: function (puzzle_id) {
	Session.set("puzzle_id", puzzle_id);
    },
    setPuzzle: function (puzzle_id) {
	this.navigate(puzzle_id, true);
    }
});

Router = new PuzzleRouter;

Meteor.startup(function () {
    Backbone.history.start({pushState: true});
});




