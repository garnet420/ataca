Actions = new Meteor.Collection("actions");
Boxes = new Meteor.Collection("boxes");
EditStatus = new Meteor.Collection("edit_status");

if (Meteor.isClient) {
    var ById = function(id) {
	return $("#"+id);
    }
    
    var selectedBox = null;
    var boxClicked = function(evt) {
	if (selectedBox == this) return;
	if (selectedBox)
	{
	    $(selectedBox).removeClass("selected");
	}
	$(this).addClass("selected");
	selectedBox = this;
    }

    var handleUndo = function() {
	var es = EditStatus.findOne({});
	if (!es || es.action < 0) return;
	var act = Actions.findOne({index: es.action});
	if (act)
	{
	    executeAction(act, true);
	    boxClicked.apply(ById(act.box_id));
	    EditStatus.update(es._id, {$inc: {action: -1}});
	}
    }

    var handleRedo = function() {
	var es = EditStatus.findOne({});
	if (!es) return;
	var act = Actions.findOne({index: es.action + 1});
	if (act)
	{
	    executeAction(act,false);
	    boxClicked.apply(ById(act.box_id));
	    EditStatus.update(es._id, {$inc: {action: 1}});	    
	}
    }

    var executeAction = function(act, reverse) {
	if (act.type == "text")
	{
	    var new_text = act.new_text;
	    if (reverse)
		new_text = act.old_text;
	    Boxes.update(act.box_id, {$set: {text: new_text}});
	    ById(act.box_id).text(new_text);
	}
    }

    var addAction = function(act) {
	var es = EditStatus.findOne({});
	Actions.remove({index: {$gt: es.action}});
	act.index = es.action + 1;
	Actions.insert(act);
	EditStatus.update(es._id, {$inc: {action: 1}});
	executeAction(act, false);
    }

    var boxKeyPress = function(id, chr) {
	var box = Boxes.findOne(id);
	if (!box) return true;
	addAction({
	    type: "text",
	    box_id: id,
	    new_text: chr,
	    old_text: box.text
	});
	return false;
    }

    var keyPress = function(evt) {
	var c = null;
	if (evt.altKey || evt.ctrlKey || evt.metaKey)
	    c = null;
	else if (evt.which == null) {
	    c = String.fromCharCode(evt.keyCode); // IE
	} else if (evt.which!=0 && evt.charCode!=0) {
	    c = String.fromCharCode(evt.which);
	} else {
	    c = null; // special key
	}
	if (c)
	{
	    var handledByBox = false;
	    if (selectedBox)
		handledByBox = !boxKeyPress(selectedBox.id, c);

	    return false;
	}
	return true;
    }

    Template.actions_view.actions = function() {
	return Actions.find({}, {sort: {index:1}});
    }

    Template.edit_status_view.edit_statuses = function () {
	return EditStatus.find({});
    }

    Template.commands.events({
	'click #undo_button' : function() {
	    handleUndo();
	},
	'click #redo_button' : function() {
	    handleRedo();
	}
    });

    Meteor.startup(function() {

	Meteor.autosubscribe(function() {
	    var boxes = Boxes.find({});
	    boxes.forEach(function(box) {
		var jq = $("#"+box._id);
		if (jq.size() == 0)
		{
		    console.log("new box!");
		    // create a new box
		    $("<div/>", {
			id:box._id
		    }).addClass("box").
			text(box.text).
			click(boxClicked).
			appendTo("body");
		    jq = $("#"+box._id);
		}
		console.log(box._id);
		jq.css("top", box.y+"em").css("left", box.x+"em");
	    });
	});
	$(document).keypress(keyPress);
    });
    
}

if (Meteor.isServer) {
  Meteor.startup(function () {
      console.log("derp");
      Boxes.remove({});
      Actions.remove({});
      EditStatus.remove({});
      Boxes.insert({x:15, y:3, text:'x'});
      Boxes.insert({x:15, y:4.5, text:' '});
      EditStatus.insert({action:-1});
    // code to run on server at startup
  });
}
