Puzzles = new Meteor.Collection("puzzles");

Meteor.publish("puzzles", function () {
  return Puzzles.find();
});

Meteor.startup(function () {
    // code to run on server at startup


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
    }
  })
