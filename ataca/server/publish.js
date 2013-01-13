Puzzles = new Meteor.Collection("puzzles");
Actions = new Meteor.Collection("actions");
Boxes = new Meteor.Collection("boxes");
EditStatus = new Meteor.Collection("edit_status");

Meteor.publish("puzzles", function () {
  return Puzzles.find();
});

Meteor.publish("boxes", function(puzzle_id) {
    return Boxes.find({puzzle_id: puzzle_id});
});

Meteor.publish("actions", function(puzzle_id, user_id) {
    return Actions.find({puzzle_id: puzzle_id, user_id:user_id});
});

Meteor.publish("edit_status", function(puzzle_id) {
    return EditStatus.find({puzzle_id: puzzle_id});
});


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
