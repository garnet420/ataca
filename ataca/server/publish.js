Puzzles = new Meteor.Collection("puzzles");
Actions = new Meteor.Collection("actions");
Boxes = new Meteor.Collection("boxes");
EditStatus = new Meteor.Collection("edit_status");

Meteor.publish("puzzles", function () {
  return Puzzles.find();
});

Meteor.publish("AllUsers", function(){
    return Meteor.users.find({});
});

<<<<<<< HEAD
Meteor.publish("edit_status", function(puzzle_id) {
    return EditStatus.find({puzzle_id: puzzle_id});
=======
Meteor.publish("boxes", function(puzzle_id) {
    return Boxes.find({puzzle_id: puzzle_id});
>>>>>>> c6b645e0f52bb84605a3c242620cf7f4ab69a8a5
});
Meteor.publish("actions", function() { return Actions.find(); });
Meteor.publish("edit_status", function() { return EditStatus.find(); });


Meteor.startup(function () {
    console.log("restarting");
    // remove this line when there are actual puzzles in the database
    Puzzles.remove({});

    if (Puzzles.find().count() === 0) {
	var data = [
	    {name: "Puzzle 1",
	     contents: "Placeholder for Puzzle 1"
	    },
	    {name: "Puzzle 2",
	     contents: "Placeholder for Puzzle 2"
	    },
	    {name: "Puzzle 3",
	     contents: "Placeholder for Puzzle 3"
	    }
	]

	for (var i = 0; i < data.length; i++) {
	    var puzzle_id = Puzzles.insert({name: data[i].name, contents: data[i].contents});
	}

	console.log("derp");
	Boxes.remove({});
	Actions.remove({});
	EditStatus.remove({});
	Boxes.insert({type: 'box', x:10, y:2, text:'x',
		      text_mode: 'answer',
		      puzzle_id: puzzle_id});
	Boxes.insert({type: 'box', x:10, y:3, text:'123456789abc',
		      text_mode: 'list',
		      puzzle_id: puzzle_id});

    }
  })
