/**
 * javascript angle input
 * 
 * written 2013 by Jochen Renner
 * scripts@jochen-renner.de
 * 
 * Example call
 * new angleinput(document.getElementById('inputid'),{style:{stroke:"red"})
 * 
 * @param inputel html input element (optional) 
 *   The canvas will be inserted before this node, values will be applied if it is set to an input element
 *   set to null if not needed  
 * @param opts object with options (all optional)
 *   value (float)    initial value (in rad) 
 *   size (int)       size of canvas
 *   rad (float)      radius of angle indicator
 *   bgrad (float)    radius of bg circle
 *   axisrad (float)  radius of axis
 *   angle0 (float)   startangle  
 *   clockwise (bool) anti/clockwise flag
 *   style (object) 
 *      stroke (string)     stroke style, color
 *      linewidth (int)     stroke line width
 *      fill (string)       fill style, color
 *      bgstroke (string)   stroke style, color of background circle
 *      bgfill (string)     fill style, color of background circle
 *      bglinewidth (int)   background circle stroke line width
 *      axislinewidth (int) axis stroke line width
 *      axisstroke (string) axis stroke style
 *   draggingstyle (object) Object with style overrides to apply while dragging. See style
 *   hoveredstyle (object)  Object with style overrides to apply while hovered. See style
 */
function angleinput(inputel,opts) {
	var golden =  1.61803398875;
	// prepare input, apply defaults
	if (!opts) opts = {};
	if (!inputel) inputel = document.body.firstChild;

	// default options
	var defopts = {
		size:64,
		rad: 24,
		bgrad: 24 / golden,
		axisrad: 32,
		angle0:0,
		clockwise:true,
		deg:true,
		style:{
			stroke:'rgba(0,0,255,0.5)',
			fill:'rgba(0,0,255,0.4)',
			linewidth:1,
			bgstroke:'#aaaaaa',
			bgfill:'#dddddd',
			bglinewidth:1,
			axislinewidth:1,
			axisstroke:"black"
		},
		draggingstyle:{
			stroke:'blue',
			fill:'rgba(0,0,255,0.7)',
			axislinewidth:2
		},
		hoveredstyle:{
			stroke:'blue',
			fill:'rgba(0,0,255,0.5)'
		}
	};
	var dragging = false,
		hovered = false,
		angle = typeof opts["value"]!="undefined" ? parseFloat(opts["value"]) : 0.789 * Math.PI,
		canvas = document.createElement("canvas"),
		context;
	
	function addEvent(evnt, el, func) {
		if (el.addEventListener) { // W3C DOM
			el.addEventListener(evnt,func,false);
		} else if (el.attachEvent) { // IE DOM
			el.attachEvent("on"+evnt, func);
		} else { 
			el['on'+evnt] = func;
		}
	}

	function apply() {
		var dest = arguments[0];
		for ( var i=arguments.length-1; i>0; i-- ){
			var src = arguments[i];
			for ( var key in src ) {
				if (typeof src[key] == "object" ) {
					dest[key] = apply(dest[key]||{}, src[key]);
					
				} else if ( typeof dest[key] == "undefined" ) {
					dest[key] = src[key];
				} 
			}
		}
		return dest;
	}
	if (opts.size) {
		if (typeof opts.rad =="undefined") opts.rad = 0.5 * opts.size / golden;
		if (typeof opts.bgrad =="undefined") opts.bgrad = opts.rad / golden;
		if (typeof opts.axisrad =="undefined") opts.axisrad = 0.5 * opts.size;
	}

	// apply default options
	apply(opts, defopts);

	// midpoint
	opts.x = opts.y = opts.size/2+0.5;

	// check if we can go
	if (!canvas || !canvas.getContext) {
		// unable to create canvas element
		return;
	}

	context = canvas.getContext("2d");
	canvas.width = opts.size;
	canvas.height = opts.size;
	
	inputel.parentNode.insertBefore(canvas,inputel);

	// paint it
	function paint() {
		
		var s = apply({}, opts.style, ( dragging ? opts.draggingstyle : ( hovered ? opts.hoveredstyle : {} ) ) || {}),
			d = opts.angle0 - angle;
		if (opts.clockwise) {
			d = 2*Math.PI-d;
		}
		// to range (webkit draws circle for angle>2PI)
		// so scale again. just to be shure
		d = d - Math.PI*2 * parseInt(0.5*d/Math.PI)

		// with is not evil
		with (context) {
			// erase bg
			clearRect(0,0,canvas.width,canvas.height);
			save();

			// paint background circle
			beginPath()
			arc(opts.x, opts.y, opts.bgrad, 0, Math.PI*2);
			fillStyle = s.bgfill;
			lineWidth = s.bglinewidth;
			strokeStyle = s.bgstroke;
			fill();
			stroke();
			
			// paint the angle indicator
			beginPath()
			moveTo(opts.x, opts.y);
			arc(opts.x, opts.y, opts.rad, opts.angle0, d, !opts.clockwise); 
			closePath();
			fillStyle = s.fill;
			lineWidth = s.linewidth;
			strokeStyle = s.stroke;
			fill();
			stroke();
			
			// paint axis
			beginPath()
			moveTo(opts.x + opts.axisrad * Math.cos(opts.angle0), opts.y + opts.axisrad * Math.sin(opts.angle0));
			lineTo(opts.x, opts.y);
			lineTo(opts.x + opts.axisrad * Math.cos(d), opts.y + opts.axisrad * Math.sin(d));
			strokeStyle = s.axisstroke;
			lineWidth = s.axislinewidth;
			stroke();
			restore();
		}
	}

	function setValue(ang) {
		if (ang<0) ang = Math.PI*2+ang;
		angle = ang - Math.PI * 2 * parseInt(0.5*ang/Math.PI);
		if (inputel && inputel.tagName.toUpperCase() == "INPUT") {
			inputel.value = 180 * angle / Math.PI;
			// fire onchange
			if ("createEvent" in document) {
			    var evt = document.createEvent("HTMLEvents");
			    evt.initEvent("change", false, true);
			    inputel.dispatchEvent(evt);
			} else {
				inputel.fireEvent("onchange");
			}
		}
		paint();
	}
	this.setValue = setValue;

	/*
	 * get position from event object
	 */
	function position(event) {
		var x, y;
		if (event.touches) {
			x = event.touches[0].clientX;
			y = event.touches[0].clientY;
		} else if (typeof event.x != "undefined" &&  typeof event.y != "undefined") {
			x = event.x;
			y = event.y;
		} else {
			x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		x -= canvas.offsetLeft;
		y -= canvas.offsetTop;
		return [x-opts.x,y-opts.y];
	}

	/*
	 * get angle from x,y
	 * @param pos
	 * @returns angle in rad
	 */
	function angleFromPos(pos) {
		var ret = 0;
		// enshure square angles
		if ( parseInt(pos[0]+0.5 ) == 0  )ret = opts.angle0+(pos[1]<0 ? Math.PI/2:3*Math.PI/2);
		if ( parseInt(pos[1]+0.5 ) == 0  )ret = opts.angle0+(pos[0]<0 ? Math.PI:0); 
		else ret = opts.angle0- Math.atan2(pos[1], pos[0]);
		if (opts.clockwise) {
			ret = 2*Math.PI - ret;
		}
		return ret;
	}
	// attach events
	addEvent("mousedown", canvas, function(e) {
		dragging = true;
		setValue( angleFromPos(position(e)) );
	});

	addEvent("mousemove", canvas, function(e) {
		if (!dragging) return;
		setValue( angleFromPos(position(e)) );
	});

	addEvent("mouseup", canvas, function(e) {
		dragging = false;
		paint();
	});

	addEvent("mouseover", canvas, function(e) {
		hovered = true;
		paint();
	});

	addEvent("mouseout", canvas, function(e) {
		hovered = dragging = false;
		paint();
	});

	addEvent("touchstart", canvas, function(e) {
		dragging = true;
		setValue( angleFromPos(position(e)) );
		e.preventDefault();
	});
	addEvent("touchmove", canvas, function(e) {
		if (!dragging) return;
		setValue( angleFromPos(position(e)) );
	});
	addEvent("touchend", canvas, function(e) {
		dragging = false;
		paint();
		e.preventDefault();
	});

	// here we go
	// initial painting done via setValue
	setValue(angle);
}