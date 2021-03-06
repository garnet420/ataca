Meteor.subscribe("AllUsers");

Session.set('puzzle_id', null);

//determine whether to show items in navbar depending on the user
Template.overview.hidden = function(){
    return "hidden";
}


//meteor widget for accounts (must configure for external services)
Accounts.ui.config({
    requestPermissions: {
    },
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'//can remove 'optional' and require an email
});

////user stuff

Template.user.userId = function () {
    //returns currently logged in user
    if (Meteor.user() != null) { 
	return Meteor.user().username;
    }
    else{ 
	return "not logged in";
    }
}

Template.user.otherUsers = function (){
    //returns other logged in users
    return Meteor.users.find({});
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

