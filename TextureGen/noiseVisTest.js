import SimplexNoise from './simplex-noise.js';

var mc = document.getElementById('myCanvas');
var ctx = mc.getContext('2d');

var cubeFaceSize=256;

mc.height = cubeFaceSize*3;
mc.width = cubeFaceSize*4;

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

function noise(nx, ny, nz, gen_num) {
// Rescale from -1.0:+1.0 to 0.0:1.0
    return generators[gen_num-1].noise3D(nx / scale, ny / scale, nz / scale) / 2 + 0.5;
}  

function colorPixel(v, x, y) {
    var color = "rgba("+v*255+","+v*255+","+v*255+"," + 255 + ")";
    ctx.fillStyle = color;
    ctx.fillRect(x,y,1,1);
}

function getHeight3D(x, y, z) {
    let nx = x/cubeFaceSize - 0.5, ny = y/cubeFaceSize - 0.5, nz = z/cubeFaceSize - 0.5;

    //octaves
    var e = (1.00 * noise( 1 * nx,  1 * ny, 1 * nz, 1)
    + 0.50 * noise( 2 * nx,  2 * ny, 2 * nz, 2)
    + 0.25 * noise( 4 * nx,  4 * ny, 4 * nz, 3)
    + 0.13 * noise( 8 * nx,  8 * ny, 8 * nz, 4)
    + 0.06 * noise(16 * nx, 16 * ny, 16 * nz, 5)
    + 0.03 * noise(32 * nx, 32 * ny, 32 * nz, 6));

    e = e / (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
    return Math.pow(e, 1);
}

function cubeMapNoiseGenerator(cubeFaceSize) {
    let cubeMap = new Array(cubeFaceSize*4).fill(new Array(cubeFaceSize*3).fill(0));
    let height = 0;
    //Z STATIC
    for(
        let y = 0; y < cubeFaceSize; y++) {
        for(
            let x = 0; x < cubeFaceSize * 2; x++) {
            //Generates FRONT
            if(x < cubeFaceSize) {
                height = getHeight3D(x, y, 0);
                cubeMap[cubeFaceSize+x][cubeFaceSize+y] = height;        
                colorPixel(height, cubeFaceSize+x, cubeFaceSize+y); 
            }
            //Generates BACK
            else {
                height = getHeight3D(cubeFaceSize-(x-cubeFaceSize), y, cubeFaceSize);
                cubeMap[cubeFaceSize*3+(x-cubeFaceSize)][cubeFaceSize+y] = height;
                colorPixel(height, cubeFaceSize*3+(x-cubeFaceSize), cubeFaceSize+y);
            }
        }
    }
    //X STATIC
    for(
        let y = 0; y < cubeFaceSize; y++) {
        for(
            let x = 0; x < cubeFaceSize * 2; x++) {
            //Generates LEFT
            if(x < cubeFaceSize) {
                height = getHeight3D(0, y, cubeFaceSize-x);
                cubeMap[x][cubeFaceSize+y] = height;
                colorPixel(height, x, cubeFaceSize+y);            
            }
            //Generates RIGHT
            else {
                height = getHeight3D(cubeFaceSize, y, x-cubeFaceSize);
                cubeMap[cubeFaceSize*2+(x-cubeFaceSize)][cubeFaceSize+y] = height;
                colorPixel(height, cubeFaceSize*2+(x-cubeFaceSize), cubeFaceSize+y);
            }
        }
    }
    //Y STATIC
    for(
        let y = 0; y < cubeFaceSize * 2; y++) {
        for(
            let x = 0; x < cubeFaceSize; x++) {
            //Generates TOP
            if(y < cubeFaceSize) {
                height = getHeight3D(x, 0, cubeFaceSize-y);
                cubeMap[cubeFaceSize+x][y] = height;
                colorPixel(height, cubeFaceSize+x, y);       
            }
            //Generates BOTTOM
            else {
                height = getHeight3D(x, cubeFaceSize, y-cubeFaceSize);
                cubeMap[cubeFaceSize+x][cubeFaceSize*2+(y-cubeFaceSize)] = height;
                colorPixel(height, cubeFaceSize+x, cubeFaceSize*2+(y-cubeFaceSize));
            }                
        }
    }
}

ctx.clearRect(0,0,cubeFaceSize*4,cubeFaceSize*3);
cubeMapNoiseGenerator(cubeFaceSize);

var img = new Image();
img.src = mc.toDataURL('image/png');



