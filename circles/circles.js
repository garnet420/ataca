// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players."

Boxes = new Meteor.Collection("boxes");
Chats = new Meteor.Collection("chats");

if (Meteor.is_client) {
    Template.username.events = {
	'click' : function(e) {alert("clicked");}
    };

    Meteor.startup(function() {
	var paper = Raphael(0, 0, 1000, 1000);

	Meteor.autosubscribe(function () {
	    var query = Boxes.find({});
	    var count = 0;
	    query.forEach(function(box) {
		count = count + 1;
		if (Session.get(box._id) == undefined)
		{
		    obj = paper.circle(box.x, box.y, 10);
		    obj.attr("fill", "black");
		    Session.set(box._id, obj.id);
		    var func = function (o) {
			var basex = 0;
			var basey = 0;

			o.drag(function(dx_,dy_)
			       { Boxes.update({_id:box._id}, {$set : {x:basex+dx_, y:basey+dy_}});},
			       function(x,y)
			       { basex = this.attr("cx"); basey = this.attr("cy"); },
			       function() {  });
		    }
		    func(obj);
		}
//		alert(" "+box._id+" "+box.x.toString()+" "+box.y.toString());
		paper.getById(Session.get(box._id)).attr({cx:box.x, cy:box.y});
	    });
	    //	    alert(count.toString());

	});

    });


}

// On server startup, create some players if the database is empty.
if (Meteor.is_server) {
    Meteor.startup(function () {
	Boxes.remove({});

	for (var i = 0; i < 4; i++)
	{
	    for (var j = 0; j < 4; j++)
	    {
		Boxes.insert({x: (i * 80), y: (j*80)});
	    }
	}

/*	var animate = function() {
	    Boxes.update({}, { $inc: {x: 1,y:0}}, {multi:true});
//	    Boxes.find({}).forEach(function(box) { Boxes.update({_id:box._id}, {x: box.x+2}) });
	    Meteor.setTimeout(animate, 50);
	    console.log("test");
	}
	Meteor.setTimeout(animate, 50);*/
    });
}
