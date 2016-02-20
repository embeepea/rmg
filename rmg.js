var Immutable = require('immutable');
var sprintf = require('sprintf');

function linearInterpolator(a,b,A,B) {
    var f = (B - A) / (b - a);
    return function(x) {
        return (x - a) * f + A;
    };
}

function immutify(o) {
    return Immutable.Map.isMap(o) ? o : Immutable.Map(o);
}


var emptyImmutableMap = Immutable.Map();

function Mg(props) {
    props = immutify(props);
    this.state = {
        lastProps: emptyImmutableMap
    };
    this.updateCanvasSize = function() {
        var state = this.state;
        var canvasWidth = state.canvas.offsetWidth;
        var canvasHeight = state.canvas.offsetHeight;
        state.canvasSized = false;
        if (canvasWidth != state.canvasWidth) {
            state.canvasWidth = canvasWidth;
            state.canvasSized = true;
        }
        if (canvasHeight != state.canvasHeight) {
            state.canvasHeight = canvasHeight;
            state.canvasSized = true;
        }
        // for some bizarre reason, these must be set every time,
        // even if they haven't changed!!!
        state.canvas.width  = canvasWidth * window.devicePixelRatio;
        state.canvas.height = canvasHeight * window.devicePixelRatio;
    };
    this.setCoords = function(props) {
        var state = this.state;
        var coords = props.get("coords");
        var w = state.canvas.width;
        var h = state.canvas.height;
        var d = Math.min(w,h);
        state.xPixel = linearInterpolator(coords[0][0], coords[1][0], (w-d)/2, (w+d)/2);
        state.yPixel = linearInterpolator(coords[0][1], coords[1][1], (h+d)/2, (h-d)/2);
        state.canvasSized = false;
    };
    this.updateState = function(props) {
        var state = this.state;
        var lastProps = state.lastProps;
        props = props || emptyImmutableMap;
        props = lastProps.merge(props);
        if (props !== lastProps) {
            if (props.get("id") !== lastProps.get("id")) {
                console.log('id changed');
                state.canvas = document.getElementById(props.get("id"));
                state.ctx = state.canvas.getContext("2d");
                this.updateCanvasSize();
            }
        }

        if (state.canvasSized
            ||
            ((props !== lastProps)
             &&
             (props.get("coords") !== lastProps.get("coords")))) {
            console.log('coords changed');
            this.setCoords(props);
        }

        state.lastProps = props;
        return props;
    };
    this.render = function(props) {
        props = immutify(props);
        props = this.updateState(props);
        var state = this.state;
        var ctx = state.ctx;

        this.updateCanvasSize();

        ctx.fillStyle = props.get("background");
        ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

        ctx.strokeStyle = props.get("linecolor");
        ctx.beginPath();
        ctx.moveTo(0,state.yPixel(props.get("y")));
        ctx.lineTo(state.canvas.width,state.yPixel(props.get("y")));
        ctx.moveTo(state.xPixel(props.get("x")),0);
        ctx.lineTo(state.xPixel(props.get("x")),state.canvas.height);
        ctx.stroke();

        var box = props.get("box");
        ctx.beginPath();
        ctx.moveTo(state.xPixel(box[0][0]), state.yPixel(box[0][1]));
        ctx.lineTo(state.xPixel(box[0][0]), state.yPixel(box[1][1]));
        ctx.lineTo(state.xPixel(box[1][0]), state.yPixel(box[1][1]));
        ctx.lineTo(state.xPixel(box[1][0]), state.yPixel(box[0][1]));
        ctx.lineTo(state.xPixel(box[0][0]), state.yPixel(box[0][1]));
        ctx.stroke();

    };
    this.updateState(props);
}

props = {
    id: "canvas",
    coords: [[-1,-1],[1,1]],
    box: [[-0.8, -0.8], [0.8, 0.8]],
    background: "#000000",
    linecolor: "#ffffff",
    x: 0.5,
    y: -0.5,
    window: {
        border: 0,
        margin: 0,
        padding: 0
    }
};

mg = new Mg(props);

mg.render();

window.addEventListener("resize", function() {
    mg.render();
});

/*
mg.render(props);

var t0 = new Date().getTime() / 1000.0;

var c = 0;
var r = 0.8;

setInterval(function() {
    var t = new Date().getTime() / 1000.0 - t0;
    mg.render({
        y: c + r * Math.sin(t)
    });
}, 10);
*/
