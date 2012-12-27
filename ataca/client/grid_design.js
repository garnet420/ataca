var gridSpacing = 48;

var setupGridDesign = function() {
    console.log("setting up grid design");
    var magicRegion = 0.25;

    var boxEq = function(b1, b2) {
	if (!b1 || !b2) return false;
	return b1.xmin == b2.xmin && b1.ymin == b2.ymin &&
	    b1.width == b2.width && b1.height == b2.height;
    }

    var createBoxesFromBox = function(box) {
	var to_add = {};
	var idx = 0;
	for (var ix = 0; ix < box.width; ++ix) {
	    for (var iy = 0; iy < box.height; ++iy) {
		var nx = box.xmin + ix;
		var ny = box.ymin + iy;
		if (!Boxes.findOne({x: nx, y: ny})) {
		    to_add[idx] = {x: nx, y:ny};
		    ++idx;
		}
	    }
	}
	if (idx) {
	    to_add.length = idx;
	    createBoxes(to_add);
	}
    }

    var dragDiv = $("#grid div.dragbox_parent");
    if (!dragDiv.length) {
	dragDiv = $("<div/>").addClass("dragbox_parent").appendTo("#grid");
    }
    var currentBox = null;
    var dragPieces = new Array;
    var gridDragUpdate = function(box) {
	if (boxEq(currentBox, box)) return;
	currentBox = box;
	
	var nPieces = box.width * box.height;
	for (var i = 0; i < nPieces; ++i)
	{
	    if (!dragPieces.hasOwnProperty(i))
	    {
		dragPieces[i] = $("<div/>").addClass("dragbox").
		    appendTo(dragDiv);
	    }
	    var px = i % box.width;
	    var py = (i - px) / box.width;
	    dragPieces[i].css("left", (px + box.xmin) * gridSpacing).
		css("top", (py + box.ymin) * gridSpacing).show();
	}
	for (var i = nPieces; i <  dragPieces.length; ++i)
	{
	    dragPieces[i].hide();
	}
    }

    var gridPos = function(evt) {
	var gpos = $("#grid").position();
	return {x: evt.pageX - gpos.left,
		y: evt.pageY - gpos.top};
    };	

    $("#grid").mousedown(function(evt) {
	dragDiv.show();
	var click = gridPos(evt);
	var in_box_x = (click.x % gridSpacing)/gridSpacing;
	var in_box_y = (click.y % gridSpacing)/gridSpacing;
	var box_x = Math.floor(click.x / gridSpacing);
	var box_y = Math.floor(click.y / gridSpacing);
	var drag_mode = {};
	if (in_box_x < magicRegion) {
	    if (in_box_y < magicRegion) {
		drag_mode = "vertex";
	    } else if (in_box_y <= 1-magicRegion) {
		drag_mode = "vedge";
	    } else {
		drag_mode = "vertex";
		box_y = box_y + 1;
	    }
	} else if (in_box_x <= 1-magicRegion) {
	    if (in_box_y < magicRegion) {
		drag_mode = "hedge";
	    } else if (in_box_y <= 1-magicRegion) {
		drag_mode = "center";
	    } else {
		drag_mode = "hedge";
		box_y = box_y + 1;
	    }
	} else {
	    box_x = box_x + 1;
	    if (in_box_y < magicRegion) {
		drag_mode = "vertex";
	    } else if (in_box_y <= 1-magicRegion) {
		drag_mode = "vedge";
	    } else {
		drag_mode = "vertex";
		box_y = box_y + 1;
	    }
	}
	
	var xyToBox = function(x,y) {
	    var nx, ny, ox = 0, oy = 0;
	    if (drag_mode == "vertex") {
		nx = Math.round(x/gridSpacing);
		ny = Math.round(y/gridSpacing);
	    } else if (drag_mode == "vedge") {
		nx = Math.round(x/gridSpacing);
		ny = Math.floor(y/gridSpacing);
		oy = 1;
	    } else if (drag_mode == "hedge") {
		nx = Math.floor(x/gridSpacing);
		ny = Math.round(y/gridSpacing);
		ox = 1;		
	    } else {
		nx = Math.floor(x/gridSpacing);
		ny = Math.floor(y/gridSpacing);
		ox = 1;
		oy = 1;
	    }
	    return {xmin: Math.min(box_x, nx),
		    ymin: Math.min(box_y, ny),
		    width:  Math.abs(box_x-nx)+ox,
		    height: Math.abs(box_y-ny)+oy};
	}
	// Seed initial motion
	gridDragUpdate(xyToBox(click.x, click.y));
	dragDiv.show();

	document.onmousemove = function(evt) {
	    var click = gridPos(evt);
	    gridDragUpdate(xyToBox(click.x, click.y));
	}
	document.onmouseup = function(evt) {
	    var click = gridPos(evt);
	    document.onmousemove = {};
	    document.onmouseup = {};
	    dragDiv.hide();
	    createBoxesFromBox(xyToBox(click.x, click.y));
	}
    });
}
