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
	});
    ret.update = function(obj) {
	var k = _.sortBy(obj.text, function(o,k) { return k; });
	if (this.conditional_create(obj.text_mode === 'list' &&
				    k.length != 0)) {
	    parent.jq.children('.pe_list_text').each(function(idx) {
		if (idx >= k.length)
		    $(this).text('');
		else
		    $(this).text(k[idx].val).css('color', k[idx].color);
	    });
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
	var k = Object.keys(obj.text);
	if (this.conditional_create(obj.text_mode != 'list' &&
				    k.length != 0)) {
	    if (k.length == 1)
		parent.jq.children('div.pe_box_answer').text(k[0]).
		css('color', obj.text[k[0]].color);
	    else
		throw 'derrrp';
	}
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
	this.jq.css('background-color', obj.bgcolor);
	this.jq.css("top", obj.y*gridSpacing+"px").
	    css("left", obj.x*gridSpacing+"px");
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
    ret.selected = function() {
	this.jq.addClass("selected");
    }
    ret.deselected = function() {
	this.jq.removeClass("selected");
    }
    ret.keypress = function(c) {
	var obj = this.db_obj();
	var entry_mode = Session.get('entry_mode');
	if (entry_mode === 'entry_mode_answer') {
	    var action = {type: 'text',
			  box_id: obj._id,
			  old_text: obj.text,
			  new_text:{},
			  old_mode: obj.text_mode};
	    action.new_text[c] = {val:c, color:'#000000'};
	    action.new_mode = 'answer';
	    addAction(action);
	    return true;
	} else if (entry_mode === 'entry_mode_small') {
	    var action = {type: 'text',
			  box_id: obj._id,
			  old_text: obj.text,
			  old_mode: obj.text_mode};
	    action.new_mode = 'list';
	    if (obj.text_mode != 'list') {
		action.new_text = {};
		action.new_text[c] = {val:c, color:'#000000'};
	    } else if (obj.text.hasOwnProperty(c)) {
		action.new_text = _.omit(obj.text, c);
	    } else {
		action.new_text = _.clone(obj.text);
		action.new_text[c] = {val:c, color:'#000000'};
	    }
	    addAction(action);
	    return true;
	}
	else if (entry_mode == 'entry_mode_bgcolor') {
	    var col = '#ffffff';
	    if (c == 'k')
		col = '#000000';
	    addAction({type: 'bgcolor', box_id: obj._id,
		       old_color: obj.bgcolor, new_color: col});
	    return true;
	}
    }
    ret.backspace = function(c) {
	var obj = this.db_obj();
	if (Session.get('entry_mode') == 'entry_mode_answer') {
	    addAction({type: 'text',
		       box_id: obj._id,
		       new_text: {},
		       new_mode: 'answer',
		       old_mode: obj.text_mode,
		       old_text: obj.text});
	}
    }
    this.e[obj._id] = ret;
    return ret;
}

PuzzleElements.select = function(id) {
    if (this.selected_element)
	this.selected_element.deselected();
    broadcastSelection(id);
    if (!id)
    {
	this.selected_element = null;
	return;
    }
    var obj = this.e[id];
    obj.selected();
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
