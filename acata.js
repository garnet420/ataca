Puzzles = new Meteor.Collection("puzzles");

if (Meteor.isClient) {

Session.set('puzzle_id', null);

///////////puzzles list
    Template.puzzles.puzzles = function () {
	return Puzzles.find({}, {sort: {name: 1}});
    };

    Template.puzzles.events({
	'mousedown .puzzle': function (evt) {
	    Session.set('puzzle_id', this._id)
	},
	'click .puzzle': function (evt) {
	    // prevent clicks on <a> from refreshing the page.
	    evt.preventDefault();
	},
	'rightclick .puzzle': function(evt){alert('clicked')}
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
      evt.target.value = "";
    }
  }));

///////////current puzzle panel

    Template.current_puzzle.any_puzzle_selected = function(){
	return !Session.equals('puzzle_id', null);
    }

    Template.current_puzzle.current_puzzle = function(){
	current_puzzle = Session.get('puzzle_id')
	return Puzzles.findOne(current_puzzle).contents;
    }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

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
  })}
