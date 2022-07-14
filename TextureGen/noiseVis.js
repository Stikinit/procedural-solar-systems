import SimplexNoise from './simplex-noise.js';

var mc = document.getElementById('myCanvas');
var ctx = mc.getContext('2d');

var h=500, w=500;

/*=============== Noise Parameters ==============*/
var scale = 0.2; //   ]0, 1]  gets the best results
var num_octaves = 6;
/*===============================================*/

// Creating noise generators
let generators = [];
for(var n=0; n<num_octaves; n++) {
    var gen = new SimplexNoise();
    generators.push(gen);
}

function noise(nx, ny, gen_num) {
// Rescale from -1.0:+1.0 to 0.0:1.0
    return generators[gen_num-1].noise2D(nx / scale, ny / scale) / 2 + 0.5;
}  

function colorPixel(v, x, y) {
    var color = "rgba(0,0,0," + v + ")";
    ctx.fillStyle = color;
    ctx.fillRect(x,y,1,1);
}

ctx.clearRect(0,0,w,h);

let height = [];   
for (let y = 0; y < h; y++) {
    height[y] = [];
    for (let x = 0; x < w; x++) {      
        let nx = x/w - 0.5, ny = y/h - 0.5;

        //octaves
        var e = (1.00 * noise( 1 * nx,  1 * ny, 1)
        + 0.50 * noise( 2 * nx,  2 * ny, 2)
        + 0.25 * noise( 4 * nx,  4 * ny, 3)
        + 0.13 * noise( 8 * nx,  8 * ny, 4)
        + 0.06 * noise(16 * nx, 16 * ny, 5)
        + 0.03 * noise(32 * nx, 32 * ny, 6));

        e = e / (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
        height[y][x] = Math.pow(e, 1);

        //color pixel on canvas
        colorPixel(height[y][x], x, y);
    }
}


