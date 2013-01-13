var PuzzleElements = {};
PuzzleElements.e = {};

PuzzleElements.create = function(obj) {
    if (obj.type == 'box')
	return this.create_box(obj);
    return null;
}

PuzzleElements.conditional_obj = function(create, destroy) {
    var created = false;
    
    return {
	create: function() {
	    created = true;
	    return create.apply(this); },
	destroy: function() {
	    created = false;
	    return destroy.apply(this); },
	conditional_create: function(cond) {
	    if (cond) {
		if (!created) {
		    this.create();
		}
		return true;
	    }
	    else if (created)
		this.destroy();
	    return false;
	}
    };
}

PuzzleElements.possibilities_boxes = function(parent) {
    var list_text = null;
    var ret = PuzzleElements.conditional_obj(
	/*create*/ function() {
	    var lt_div = $("<div/>").addClass("pe_list_text");
	    for (var y = 0; y < 3; ++y)
		for (var x = 0; x < 4; ++x)
		    parent.jq.append(lt_div.clone().
				     css("top", y*33 + "%").
				     css("left", (x*24+2) + "%"));
	},
	/* destroy */ function() {
	    parent.jq.children('div.pe_list_text').remove();
	    list_text = null;
	});
    ret.update = function(obj) {
	if (this.conditional_create(obj.text_mode === 'list' &&
				    obj.text.length != 0)) {
	    console.log('^: ' + list_text + ' ' + obj.text);
	    if (list_text != obj.text) {
		console.log('changing');
		parent.jq.children('.pe_list_text').each(function(idx) {
		    if (idx >= obj.text.length)
			$(this).text('');
		    else
			$(this).text(obj.text[idx]);
		});
		list_text = obj.text;
	    }
	}
    }
    return ret;
}

PuzzleElements.answer_box = function(parent) {
    var ret = PuzzleElements.conditional_obj(
	/*create*/ function() {
	    $("<div/>").addClass("pe_box_answer").appendTo(parent.jq);
	},
	/*destroy*/ function() {
	    parent.jq.children('div.pe_box_answer').remove();
	});
    ret.update = function(obj) {
	if (this.conditional_create(obj.text_mode != 'list' &&
				    obj.text.length != 0))
	    parent.jq.children('div.pe_box_answer').text(obj.text);
    }
    return ret;
}

PuzzleElements.create_box = function(obj) {
    if (this.e.hasOwnProperty(obj._id))
	throw 'object ' + obj._id + ' already exists';
    var ret = {};
    ret.jq = $("<div/>", {id:obj._id}).
	addClass("pe_box").
	click(function(evt) { PuzzleElements.select(obj._id); });
    ret.possibilities = PuzzleElements.possibilities_boxes(ret);
    ret.answer = PuzzleElements.answer_box(ret);
    ret.update = function(obj) {
	this.jq.css("top", obj.y*gridSpacing+"px").
	    css("left", obj.x*gridSpacing+"px");
	console.log('updating ' + obj.text);
	this.possibilities.update(obj);
	this.answer.update(obj);
    }
    ret.update(obj);
    ret.jq.appendTo("#grid");
    ret.destroy = function() {
	this.possibilities.destroy();
	this.answer.destroy();
	this.jq.remove();
    }
    ret.db_obj = function() {
	return Boxes.findOne(obj._id);
    }
    ret.keypress = function(c) {
	var obj = this.db_obj();
	var action = {type: 'text',
		      box_id: obj._id,
		      old_text: obj.text,
		      old_mode: obj.text_mode};
	if (entry_mode === 'fill') {
	    action.new_text = c;
	    action.new_mode = 'answer';
	} else {
	    action.new_mode = 'list';
	    var ins_idx = 0;
	    if (obj.text_mode === 'list') {
		for ( ; ins_idx < obj.text.length; ++ins_idx) {
		    if (obj.text.charAt(ins_idx) === c) {
			action.new_text = obj.text.substring(0, ins_idx) + 
			    obj.text.substring(ins_inx + 1);
			addAction(action);
//			this.possibilities.
			return true;
		    } else if (obj.text.charAt(ins_idx) > c) {
			action.new_text = obj.text.substring(0, ins_idx) +
			    c + obj.text.substring(ins_idx);
			addAction(action);
			return true;
		    }
		}
		action.new_text = obj.text + c;
	    } else {
		action.new_text = c;
	    }
	}
	addAction(action);
	return true;
    }
    ret.backspace = function(c) {
	if (entry_mode == 'fill') {
	    addAction({type: 'text',
		       box_id: obj._id,
		       new_text: '',
		       old_text: this.db_obj().text});
	}
    }
    this.e[obj._id] = ret;
    return ret;
}

PuzzleElements.select = function(id) {
    if (this.selected_element)
	this.selected_element.jq.removeClass("selected");
    broadcastSelection(id);
    if (!id)
    {
	this.selected_element = null;
	return;
    }
    var obj = this.e[id];
    obj.jq.addClass("selected");
    this.selected_element = obj;
}

PuzzleElements.destroy = function(id) {
    var obj = this.e[id];
    delete this.e.id;
    obj.destroy();
}

PuzzleElements.destroy_all = function() {
    for (var key in this.e) {
	if (this.e.hasOwnProperty(key)) {
	    this.e[key].destroy();
	}
    }
    this.e = {};
}

PuzzleElements.otheruser_select = function(id) {
    if (!this.e.hasOwnProperty(id))
	return;
    this.e[id].jq.addClass("otheruser_selected");
    var to = this.e[id].otheruser_select_timeout;
    if (to)
	Meteor.clearTimeout(to);
    this.e[id].otheruser_select_timeout = Meteor.setTimeout(function() {
	PuzzleElements.otheruser_deselect(id);
    }, 360000);
}

PuzzleElements.otheruser_deselect = function(id) {
    if (!this.e.hasOwnProperty(id))
	return;
    this.e[id].jq.removeClass("otheruser_selected");
    var to = this.e[id].otheruser_select_timeout;
    if (to)
	Meteor.clearTimeout(to);
    this.e[id].otheruser_select_timeout = null;
}
