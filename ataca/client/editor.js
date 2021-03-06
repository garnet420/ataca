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
	Boxes.update(act.box_id,
		     {$set: {text: new_text, text_mode: new_mode}});
    } else if (act.type === 'bgcolor') {
	var new_col = reverse ? act.old_color : act.new_color;
	Boxes.update(act.box_id,
		     {$set: {bgcolor: new_col}});
    } else if (act.type == "create_boxes") {
	if (!reverse) {
	    for (var idx = 0; idx < act.where.length ; ++idx) {
		Boxes.insert({type:'box',
			      x:act.where[idx].x,
			      y:act.where[idx].y,
			      text:{},
			      text_mode:'answer',
			      bgcolor: '#ffffff',
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
			      y:act.where[idx].y,
			      puzzle_id:Session.get('puzzle_id')});
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

var keyPress = function(evt) {
    var d = event.srcElement || event.target;

    // We let text fields get filled out and we reject backspace from not being handled
    if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT'
						 || d.type.toUpperCase() === 'PASSWORD')) 
	|| d.tagName.toUpperCase() === 'TEXTAREA') {
	return !( d.readOnly || d.disabled );
    } else if (!PuzzleElements.selected_element) {
	return false;
    }

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
    var d = event.srcElement || event.target;

    // We let text fields get filled out and we reject backspace from not being handled
    if ((d.tagName.toUpperCase() === 'INPUT' && (d.type.toUpperCase() === 'TEXT'
						 || d.type.toUpperCase() === 'PASSWORD')) 
	|| d.tagName.toUpperCase() === 'TEXTAREA') {
	return !( d.readOnly || d.disabled );
    } else if (!PuzzleElements.selected_element && kc === 8) {
	return false;
    }

    if (kc == 9) {
	// cycle between answe and small modes
	if (Session.get('entry_mode') === 'entry_mode_small')
	    Session.set('entry_mode', 'entry_mode_answer');
	else if (Session.get('entry_mode') === 'entry_mode_answer')
	    Session.set('entry_mode', 'entry_mode_small');
	return false;
    }

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

Template.edit_status.index = function() {
    var es = EditStatus.findOne({user_id: Meteor.userId()});
    return es && es.action;
}

Template.editor.events({
    'mousedown #grid' : function(evt) {
	if (Session.equals('mouse_mode', 'draw'))
	    GridDesign.draw_boxes_mousedown(evt);
    }
});

Template.commands.events({
    'click #undo_button' : function() {
	handleUndo();
    },
    'click #redo_button' : function() {
	handleRedo();
    },
    'click #draw_button' : function() {
	console.log('draw clicked');

	if (!Session.get('mouse_mode') || Session.get('mouse_mode') != 'draw') {
	    Session.set('mouse_mode', 'draw');
	} else {
	    Session.set('mouse_mode', 'none');
	}
    },
    'click #entry_modes .option_button' : function() {
	Session.set('entry_mode', this.id);
    }
});

Template.commands.events(okCancelEvents('#duplicate-puzzle', {
    ok: function(text, evt) {
	console.log('Creating puzzle ' + text);
	var pid = Puzzles.insert({name: text, contents: ''});
	Boxes.find({puzzle_id: Session.get('puzzle_id')}).forEach(function (obj) {
	    var new_box = _.clone(obj);
	    delete(new_box._id);
	    new_box.puzzle_id = pid;
	    Boxes.insert(new_box);
	});	
	Router.setPuzzle(null);
    }}));


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
    $(this.ducument).off('keypress');
    $(this.document).off('keydown');
    $(document).keypress(keyPress);
    $(document).keydown(keyDown);
    ret.stop = function() {
	this.es_obs.stop();
	this.box_obs.stop();
	if (this.document) {
	    $(this.ducument).off('keypress');
	    $(this.document).off('keydown');
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

Template.commands.draw_mode = function() {
    return Session.get('mouse_mode') === "draw";
}

Template.commands.entry_mode_selected = function() {
    return Session.equals('entry_mode', this.id);
}

Template.commands.entry_modes = function() {
    return [{id:'entry_mode_small', name:'Small'},
	    {id:'entry_mode_answer', name:'Answer'},
	    {id:'entry_mode_bgcolor', name:'BG Color'}]
}

Template.commands.duplicate_placeholder = function() {
    return Session.get('puzzle_id') && ('Copy of ' + Puzzles.findOne(Session.get('puzzle_id')).name);
}
