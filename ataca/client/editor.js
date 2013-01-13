Actions = new Meteor.Collection("actions");
Boxes = new Meteor.Collection("boxes");
EditStatus = new Meteor.Collection("edit_status");

Meteor.autosubscribe(function() {
    if (Session.get('puzzle_id')) {
	Meteor.subscribe("actions",
			 Session.get("puzzle_id"),
			 Meteor.userId());
	Meteor.subscribe("edit_status", Session.get("puzzle_id"));
	Meteor.subscribe("boxes", Session.get("puzzle_id"));
    }
});



var selections = {};

/*Meteor.autosubscribe(function() {
    EditStatus.find({}).forEach(function(es) {
	
	console.log(es);
	if (es.selection_id) {
	    ById(es.selection_id).addClass("selected");
	}
    });
});*/

var myEditStatus = function() {
    var es = EditStatus.findOne({user_id: Meteor.userId()});
    if (!es)
    {
	console.log("inserting blanks es");
	console.log(Session.get('puzzle_id')+" "+Meteor.userId());
	if (Session.get('puzzle_id') && Meteor.userId())
	{
	    es = {puzzle_id: Session.get('puzzle_id'),
		  user_id:   Meteor.userId(),
		  action:   -1,
		  selection_id : null
		 };
	    es._id = EditStatus.insert(es);
	}
	return es;
    }
    return es;
}

var handleUndo = function() {
    var es = myEditStatus();
    if (!es || es.action < 0) return;
    var act = Actions.findOne({index: es.action});
    if (act)
    {
	executeAction(act, true);
	if (act.hasOwnProperty('box_id'))
	    PuzzleElements.select(act.box_id);
	EditStatus.update(es._id, {$inc: {action: -1}});
    }
}

var handleRedo = function() {
    var es = myEditStatus();
    if (!es) return;
    var act = Actions.findOne({index: es.action + 1});
    if (act)
    {
	executeAction(act,false);
	if (act.hasOwnProperty('box_id'))
	    PuzzleElements.select(act.box_id);
	EditStatus.update(es._id, {$inc: {action: 1}});
    }
}

var executeAction = function(act, reverse) {
    if (act.type == "text")
    {
	var new_text = reverse ? act.old_text : act.new_text;
	var new_mode = reverse ? act.old_mode : act.new_mode;
	console.log(new_text);
	Boxes.update(act.box_id,
		     {$set: {text: new_text, text_mode: new_mode}});
    } else if (act.type == "create_boxes") {
	if (!reverse) {
	    for (var idx = 0; idx < act.where.length ; ++idx) {
		Boxes.insert({type:'box',
			      x:act.where[idx].x,
			      y:act.where[idx].y,
			      text:' ',
			      puzzle_id:Session.get('puzzle_id')
			     });
	    }
	} else {
	    new_act = {type: "delete_boxes", where:act.where};
	    executeAction(new_act, false);
	}
    } else if (act.type == "delete_boxes") {
	if (!reverse) {
	    for (var idx = 0; idx < act.where.length ; ++idx) {
		Boxes.remove({x:act.where[idx].x,
			      y:act.where[idx].y, text:' '});
	    }
	} else {
	    new_act = {type: "create_boxes", where:act.where};
	    executeAction(new_act, false);
	}
    }
}

var broadcastSelection = function(id) {
    var es = myEditStatus();
    if (!es) return;
    EditStatus.update(es._id, {$set: {selection_id: id}});
}

var addAction = function(act) {
    var es = myEditStatus();
    if (!es) return;
    var uid = Meteor.userId(), pid = Session.get('puzzle_id');
    Actions.remove({user_id: uid, puzzle_id: pid, index: {$gt: es.action}});
    act.index = es.action + 1;
    act.user_id = Meteor.userId();
    act.puzzle_id = Session.get('puzzle_id');
    Actions.insert(act);
    EditStatus.update(es._id, {$inc: {action: 1}});
    executeAction(act, false);
}

var createBoxes = function(to_add) {
    addAction({
	type: "create_boxes",
	where: to_add});
}

var entry_mode = 'fill';

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
	var handled = false;
	if (PuzzleElements.selected_element)
	    handled = PuzzleElements.selected_element.keypress(c);

	return !handled;
    }
    return true;
}

var keyDown = function(evt) {
    var kc = evt.keyCode;
    // We do not let the browser grab backspace ever, because that
    // is the back button and fuck that noise
    if (!PuzzleElements.selected_element) return kc != 8;

    if (kc == 8) {
	PuzzleElements.selected_element.backspace();
	return false;
    }
    // arrow key
    if (kc == 37 || kc == 38 || kc == 39 || kc == 40) {
	var dx = 0, dy = 0;
	if (kc == 37)      dx = -1;
	else if (kc == 38) dy = -1;
	else if (kc == 39) dx =  1;
	else if (kc == 40) dy =  1;
	var cbox = PuzzleElements.selected_element.db_obj();
	if (cbox) {
	    nbox = Boxes.findOne({puzzle_id: Session.get('puzzle_id'),
				  x : cbox.x + dx,
				  y : cbox.y + dy});
	    if (nbox)
		PuzzleElements.select(nbox._id);
	}
	return false;
    }
    return true;
}

Template.commands.events({
    'click #undo_button' : function() {
	handleUndo();
    },
    'click #redo_button' : function() {
	handleRedo();
    },
    'click #number_button' : function() {
	entry_mode = 'number';
    },
    'click #fill_button' : function() {
	entry_mode = 'fill';
    }
});

var EditorContext = function() {
    var ret = {};
    ret.box_obs = Boxes.find({}).observe({
	removed: function(old, idx) {
	    PuzzleElements.destroy(old._id);
	},
	added: function(doc, idx) {
	    PuzzleElements.create(doc);
	},
	changed: function(doc, idx, old) {
	    PuzzleElements.e[doc._id].update(doc);
	}
    });
    
    ret.es_obs = EditStatus.find({}).observe({
	removed: function(old, idx) {
	    if (old.puzzle_id != Session.get('puzzle_id'))
		return;
	    if (old.user_id == Meteor.userId())
		return;
	    if (old.selection_id)
		PuzzleElements.otheruser_deselect(old.selection_id);
	},
	added: function(doc, idx) {
	    if (doc.puzzle_id != Session.get('puzzle_id'))
		return;
	    if (doc.user_id == Meteor.userId())
		return;
	    if (doc.selection_id)
		PuzzleElements.otheruser_select(doc.selection_id);
	},
	changed: function(doc, idx, old) {
	    if (doc.puzzle_id != Session.get('puzzle_id'))
		return;
	    if (doc.user_id == Meteor.userId())
		return;
	    if (old.selection_id)
		PuzzleElements.otheruser_deselect(old.selection_id);
	    if (doc.selection_id)
		PuzzleElements.otheruser_select(doc.selection_id);	    
	}});
    ret.document = document;
    $(document).keypress(keyPress);
    $(document).keydown(keyDown);    
    ret.stop = function() {
	this.es_obs.stop();
	this.box_obs.stop();
	if (this.document) {
	    $(this.ducument).keypress(null);
	    $(this.document).keydown(null);
	}
	PuzzleElements.destroy_all();
    }
    return ret;
};

var editor_context=null;

Template.editor.created = function() {
    console.log('created');
    Template.editor.rendered = function() {
	console.log('rendered');
	setupGridDesign();
	Template.editor.rendered = undefined;
	editor_context = EditorContext();
    }
};

Template.editor.destroyed = function() {
    console.log("unkey");
    if (editor_context) {
	console.log('destroy everything');
	editor_context.stop();
	editor_context = null;
    }
}
