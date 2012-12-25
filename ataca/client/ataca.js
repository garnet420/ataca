//lists of users with permission to view a puzzle
//something fades back to "unclicked" color slowly over time

//users
console.log("running client code");

Puzzles = new Meteor.Collection("puzzles");
Session.set("puzzles_loaded", false);

Meteor.subscribe("puzzles", function() {
    Session.set("puzzles_loaded", true);
});

//////Backbone for tracking puzzle in URL
var PuzzleRouter = Backbone.Router.extend({
    routes: {
	":puzzle_id": "main"
    },
    main: function (puzzle_id) {
	Session.set("puzzle_id", puzzle_id);
    },
    setPuzzle: function (puzzle_id) {
	console.log("setPuzzle");
	this.navigate(puzzle_id, true);
    }
});

Router = new PuzzleRouter;

//Meteor.autosubscribe(function() {
    //checks for invalid puzzle id in session (due to server re-populating the puzzle database as well as for whether a puzzle has been selected.
//});

Meteor.autosubscribe(function() {
    var pid = Session.get('puzzle_id');
     if (pid == null) {
	 Session.set("editing", false);
	 return;
     }
    if (!Session.get("puzzles_loaded")) return;

    if (Puzzles.findOne(pid)) {
	console.log('"'+pid + '"'+" found");
	Session.set("editing", true);
    } else {
	console.log('"'+pid + '"'+" not found");
	Router.navigate('/');
	Session.set("editing", false);
	Session.set('puzzle_id', null);
    }
});

Template.main.editing = function() {
    return Session.get("editing");
}

Template.main.loading = function() {
    return !Session.get("puzzles_loaded");
}

Template.editor.current_puzzle = function(){
    var current_puzzle_id = Session.get('puzzle_id');
    return Puzzles.findOne(current_puzzle_id).contents;
}

Meteor.startup(function () {
    Backbone.history.start({pushState: true});
});




