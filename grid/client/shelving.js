function SvgBase(arg) {
    var dom = this.optionalMake(arg);

    this.dom = dom;
    this.parent_svg = null;
};

SvgBase.prototype.make = function(type) {
    return document.createElementNS(this.xmlns, type);
}
SvgBase.prototype.optionalMake = function(arg) {
    if (typeof(arg) == "string")
	return this.make(arg);
    else
	return arg;
}

SvgBase.prototype.xmlns = "http://www.w3.org/2000/svg";
SvgBase.prototype.attr = function(dict) {
    for (var key in dict) if (dict.hasOwnProperty(key)) {
	this.dom.setAttribute(key.replace(/_/g,"_"), String(dict[key]));
    }
}
SvgBase.prototype.remove = function() {
    if (this.dom)
	this.dom.parentNode.removeChild(this.dom);
    this.parent_svg = null;
}


function SvgChildElement(arg, parent_obj) {
    SvgBase.call(this, arg);
    this.parent_obj = null;
    if (parent_obj)
	parent_obj.addChild(this);
};

SvgChildElement.prototype = Object.create( SvgBase.prototype );    
SvgChildElement.prototype.drag = function(move, begin, end) {
    var this_obj = this;
    this.dom.onmousedown = function(evt) {
	this_obj.parent_svg.beginDrag(this_obj, evt, move, begin, end);
    }
}

function SvgSvgElement(width, height) {
    SvgBase.call(this, "svg");
    this.attr({version:1.1,
	       xmlns:this.xmlns});
    if (typeof(width) == "number") {
	this.attr({height:height, width:width});
    }
    this.parent_svg = this;
    this.current_drag = null;
};

SvgSvgElement.prototype = Object.create( SvgBase.prototype );
SvgSvgElement.prototype.addChild = function (obj) {
    this.dom.appendChild(obj.dom);
    obj.parent_svg = this.parent_svg;
    obj.parent_obj = this;
}

SvgSvgElement.prototype.beginDrag = function (obj, evt, move, begin, end) {
    // Are we already dragging a motherfucker?
    if (this.current_drag)
	this.endDrag(evt);

    begin.call(obj, evt.pageX, evt.pageY, evt);
    this.current_drag = {
	saved_mousemove: document.onmousemove,
	saved_mouseup: document.onmouseup,
	object: obj,
	begin_x : evt.pageX,
	begin_y : evt.pageY,
	move_handler : move,
	end_handler : end
    };
/*
    alert(evt.pageX.toString() + " " + evt.pageY.toString() + " " +
	  this.dom.getBBox().x.toString() + " " + this.dom.getBBox().y.toString() + " " +
	  this.dom.getBBox().width.toString() + " " + this.dom.getBBox().height.toString());
*/
    var this_svg = this;
    document.onmousemove = function(evt) {
	if (this_svg.current_drag) {
	    this_svg.current_drag.move_handler.call(this_svg.current_drag.object,
						    evt.pageX - this_svg.current_drag.begin_x,
						    evt.pageY - this_svg.current_drag.begin_y,
						    evt);
	}
	else {
	    // maybe alert the console here? we should never be here
	    document.onmousemove = null;
	}
    }
    document.onmouseup = function(evt) {
	if (this_svg.current_drag)
	    this_svg.endDrag(evt);
	else
	    document.onmouseup = null;
    }    
}

SvgSvgElement.prototype.endDrag = function(evt) {
    document.onmousemove = this.current_drag.saved_mousemove;
    document.onmouseup = this.current_drag.saved_mouseup;
    this.current_drag.end_handler.call(this.current_drag.object,
				       evt.pageX - this.current_drag.begin_x,
				       evt.pageY - this.current_drag.begin_y,
				       evt);
    this.current_drag = null;
}


function SvgCircleElement(parent, dict, dom) {
    SvgChildElement.call(this, dom || "circle", parent);
    this.attr(dict);
};

SvgCircleElement.prototype = Object.create(SvgChildElement.prototype);
SvgCircleElement.prototype.reposition = function(x,y) {
    this.dom.cx.baseVal.value = x;
    this.dom.cy.baseVal.value = y;
    return this;
}
SvgCircleElement.prototype.position = function() {
    return {x:this.dom.cx.baseVal.value, y:this.dom.cy.baseVal.value};
}
SvgCircleElement.prototype.resize = function(r) {
    this.dom.r.baseVal.value = r;
    return this;
}
SvgCircleElement.prototype.clone = function(parent, dict) {
    var new_dom = this.dom.cloneNode(true);
    return new SvgCircleElement(parent, dict, new_dom);
}

SvgSvgElement.prototype.circle = function(x,y,r,dict) {
    return new SvgCircleElement(this, dict).reposition(x,y).resize(r);
}

function SvgRectElement(parent, dict, dom) {
    SvgChildElement.call(this, this.optionalMake(dom || "rect"), parent);
    this.attr(dict);
}

SvgRectElement.prototype = Object.create(SvgChildElement.prototype);
SvgRectElement.prototype.reposition = function(x,y) {
    this.dom.x.baseVal.value = x;
    this.dom.y.baseVal.value = y;
    return this;
}
SvgRectElement.prototype.resize = function(w,h) {
    this.dom.width.baseVal.value = w;
    this.dom.height.baseVal.value = h;
    return this;
}
SvgRectElement.prototype.position = function() {
    return {x:this.dom.x.baseVal.value, y:this.dom.y.baseVal.value};
}
SvgRectElement.prototype.clone = function(parent, dict) {
    var new_dom = this.dom.cloneNode(true);
    return new SvgRectElement(parent, dict, new_dom);
}

SvgSvgElement.prototype.rect = function(x,y,w,h,dict) {
    return new SvgRectElement(this, dict).reposition(x,y).resize(w,h);
}

