// ge1doot - last modified: 20150516
"use strict";
var ge1doot = ge1doot || {};
ge1doot.canvas = function(id) {
  "use strict";
  var canvas = { width: 0, height: 0, left: 0, top: 0, ctx: null, elem: null };
  var elem = document.getElementById(id);
  if (elem) {
    canvas.elem = elem;
  } else {
    canvas.elem = document.createElement("canvas");
    document.body.appendChild(canvas.elem);
  }
  canvas.elem.onselectstart = function() { return false; }
  canvas.elem.ondragstart = function() { return false; }
  canvas.ctx = canvas.elem.getContext("2d");
  canvas.setSize = function() {
    var o = this.elem;
    var w = this.elem.offsetWidth * 1;
    var h = this.elem.offsetHeight * 1;
    if (w != this.width || h != this.height) {
      for (this.left = 0, this.top = 0; o != null; o = o.offsetParent) {
        this.left += o.offsetLeft;
        this.top += o.offsetTop;
      }
      this.width = this.elem.width = w;
      this.height = this.elem.height = h;
      this.resize && this.resize();
    }
  }
  window.addEventListener('resize', canvas.setSize.bind(canvas), false);
  canvas.setSize();
  canvas.pointer = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    startX: 0,
    startY: 0,
    canvas: canvas,
    touchMode: false,
    isDown: false,
    center: function(s) {
      this.dx *= s;
      this.dy *= s;
      endX = endY = 0;
    },
    sweeping: false,
    scale: 0
  }
  var started = false,
    endX = 0,
    endY = 0,
    scaling = false,
    pinchStart0X = 0,
    pinchStart1X = 0,
    pinchStart0Y = 0,
    pinchStart1Y = 0;
  var addEvent = function(elem, e, fn) {
    for (var i = 0, events = e.split(','); i < events.length; i++) {
      elem.addEventListener(events[i], fn.bind(canvas.pointer), false);
    }
  }
  var distance = function(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }
  addEvent(window, "mousemove,touchmove", function(e) {
    e.preventDefault();
    this.touchMode = e.targetTouches;
    if (scaling && this.touchMode) {
      this.scale = distance(
        this.touchMode[0].clientX - this.touchMode[1].clientX,
        this.touchMode[0].clientY - this.touchMode[1].clientY
      ) / distance(
        pinchStart0X - pinchStart1X,
        pinchStart0Y - pinchStart1Y
      );
      if (this.pinch) this.pinch(e);
      return;
    }
    var pointer = this.touchMode ? this.touchMode[0] : e;
    this.x = pointer.clientX - this.canvas.left;
    this.y = pointer.clientY - this.canvas.top;
    if (started) {
      this.sweeping = true;
      this.dx = endX - (this.x - this.startX);
      this.dy = endY - (this.y - this.startY);
    }
    if (this.move) this.move(e);
  });
  addEvent(canvas.elem, "mousedown,touchstart", function(e) {
    e.preventDefault();
    this.touchMode = e.targetTouches;
    if (this.touchMode && e.touches.length === 2) {
      scaling = true;
      started = false;
      pinchStart0X = this.touchMode[0].clientX;
      pinchStart1X = this.touchMode[1].clientX;
      pinchStart0Y = this.touchMode[0].clientY;
      pinchStart1Y = this.touchMode[1].clientY;
    } else {
      var pointer = this.touchMode ? this.touchMode[0] : e;
      this.startX = this.x = pointer.clientX - this.canvas.left;
      this.startY = this.y = pointer.clientY - this.canvas.top;
      started = true;
      this.isDown = true;
      if (this.down) this.down(e);
      setTimeout(function() {
        if (!started && Math.abs(this.startX - this.x) < 11 && Math.abs(this.startY - this.y) < 11) {
          if (this.tap) this.tap(e);
        }
      }.bind(this), 200);
    }
  });
  addEvent(window, "mouseup,touchend,touchcancel", function(e) {
    e.preventDefault();
    if (scaling) {
      scaling = false;
      return;
    }
    if (started) {
      endX = this.dx;
      endY = this.dy;
      started = false;
      this.isDown = false;
      if (this.up) this.up(e);
      this.sweeping = false;
    }
  });
  return canvas;
}

!function() {

  function blend(source, id, isBg, threshold) {
    var imgSource = new Image();
    imgSource.crossOrigin = "Anonymous";
    imgSource.src = source;

    imgSource.onload = function() {
      // render image in canvas
      var jpg = document.createElement('canvas');
      var w = jpg.width = this.width;
      var h = jpg.height = this.height;
      var ctx = jpg.getContext('2d');
      ctx.drawImage(this, 0, 0, canvas.width, canvas.height);

      var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var data = img.data;
      for (var i = 0, n = data.length; i < n; i += 4) {
        var r = data[i + 0];
        var g = data[i + 1];
        var b = data[i + 2];

        // Filter out anything past the threshold
        if ((r > threshold && g > threshold && b > threshold) && !isBg) {
          data[i + 3] = 0;
        }
      }

      // Blend the final image
      var transparent = document.createElement('canvas');
      transparent.width = w; transparent.height = h;
      var ctx = transparent.getContext('2d');
      ctx.putImageData(img, 0, 0);
      images[id] = transparent;
    }
  }

  // draw parallax image
  function parallax(id, x, y) {
    var image = images[id];
    if (image) {
      ctx.drawImage(image, x, y, canvas.width, canvas.height);
    }
  }

  function render() {
    var mult = 0.25;
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Easing
    pointer.cx += (pointer.x - pointer.cx) / 10;
    pointer.cy += (pointer.y - pointer.cy) / 10;
    var rx = -((canvas.width / 2) - Math.max(15, Math.min(pointer.cx, canvas.width - 15))) / 7;
    var ry = -((canvas.height / 2) - Math.max(0, Math.min(pointer.cy, canvas.height - 5))) / 4.75;

    // Parallax
    parallax(0, mult * (-20 + (rx / 2)), 0.25 * (ry * 2));
    parallax(1, mult * (-40 + (rx / 2)), 100 + (ry / -2));
    parallax(2, mult * (0 + (rx / 3)), -100 + (ry / 3));
  }

  var canvas = ge1doot.canvas("canvas");
  var ctx = canvas.ctx;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var pointer = canvas.pointer;
  pointer.cx = pointer.x = canvas.width / 2;
  pointer.cy = 0;
  pointer.y = canvas.height;

  var images = [];
  blend("img/_bg.jpg", 0, true, 230);
  blend("img/_mg.jpg", 1, false, 230);
  blend("img/_fg.jpg", 2, false, 110);

  window.addEventListener('resize', resizeCanvas, false);
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // render();
  }

  render();
}();
