//import SimplexNoise from './simplex-noise.js';
// Creating noise generators
var generators = [];
var num_octaves = 6;
for(var n=0; n<num_octaves; n++) {
    var gen = new SimplexNoise();
    generators.push(gen);
}

/*==== Generate random color palette using chroma.js ====*/
function generatePalette(distinct) {
    var num_thresholds = Math.floor(Math.random() * (11 - 3) + 3);
    var colors = [];
    for(var c=0; c<num_thresholds; c++) {
        colors.push(chroma.random());
    }
    return (distinct ? 
                chroma.scale(colors).classes(num_thresholds) 
                : chroma.scale(colors)); // Choose between a continous or a distinct coloScale

}
/*=======================================*/

function noise(nx, ny, nz, gen_num, scale) {
// Rescale from -1.0:+1.0 to 0.0:1.0
    return generators[gen_num-1].noise3D(nx / scale, ny / scale, nz / scale) / 2 + 0.5;
}  

function colorPixel(h, x, y, colorScale, ctx) {
    var color = colorScale(h); // Get color based on height from palette
    ctx.fillStyle = color;
    ctx.fillRect(x,y,1,1);
}

function getHeight3D(x, y, z, scale, power, cubeFaceSize) {
    let nx = x/cubeFaceSize - 0.5, ny = y/cubeFaceSize - 0.5, nz = z/cubeFaceSize - 0.5;

    //octaves
    var e = (1.00 * noise( 1 * nx,  1 * ny, 1 * nz, 1, scale)
    + 0.50 * noise( 2 * nx,  2 * ny, 2 * nz, 2, scale)
    + 0.25 * noise( 4 * nx,  4 * ny, 4 * nz, 3, scale)
    + 0.13 * noise( 8 * nx,  8 * ny, 8 * nz, 4, scale)
    + 0.06 * noise(16 * nx, 16 * ny, 16 * nz, 5, scale)
    + 0.03 * noise(32 * nx, 32 * ny, 32 * nz, 6, scale));

    e = e / (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
    return Math.pow(e, power);
}

function cubeMapNoiseGenerator(cubeFaceSize, scale, power, colorScale, ctx) {
    let cubeMap = new Array(cubeFaceSize*4).fill(new Array(cubeFaceSize*3).fill(0)); //This is actually not being used, but it could be useful in the future
    let height = 0;
    //Z STATIC
    for(
        let y = 0; y < cubeFaceSize; y++) {
        for(
            let x = 0; x < cubeFaceSize * 2; x++) {
            //Generates FRONT
            if(x < cubeFaceSize) {
                height = getHeight3D(x, y, 0, scale, power, cubeFaceSize);
                cubeMap[cubeFaceSize+x][cubeFaceSize+y] = height;        
                colorPixel(height, cubeFaceSize+x, cubeFaceSize+y, colorScale, ctx); 
            }
            //Generates BACK
            else {
                height = getHeight3D(cubeFaceSize-(x-cubeFaceSize), y, cubeFaceSize, scale, power, cubeFaceSize);
                cubeMap[cubeFaceSize*3+(x-cubeFaceSize)][cubeFaceSize+y] = height;
                colorPixel(height, cubeFaceSize*3+(x-cubeFaceSize), cubeFaceSize+y, colorScale, ctx);
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
                height = getHeight3D(0, y, cubeFaceSize-x, scale, power, cubeFaceSize);
                cubeMap[x][cubeFaceSize+y] = height;
                colorPixel(height, x, cubeFaceSize+y, colorScale, ctx);            
            }
            //Generates RIGHT
            else {
                height = getHeight3D(cubeFaceSize, y, x-cubeFaceSize, scale, power, cubeFaceSize);
                cubeMap[cubeFaceSize*2+(x-cubeFaceSize)][cubeFaceSize+y] = height;
                colorPixel(height, cubeFaceSize*2+(x-cubeFaceSize), cubeFaceSize+y, colorScale, ctx);
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
                height = getHeight3D(x, 0, cubeFaceSize-y, scale, power, cubeFaceSize);
                cubeMap[cubeFaceSize+x][y] = height;
                colorPixel(height, cubeFaceSize+x, y, colorScale, ctx);       
            }
            //Generates BOTTOM
            else {
                height = getHeight3D(x, cubeFaceSize, y-cubeFaceSize, scale, power, cubeFaceSize);
                cubeMap[cubeFaceSize+x][cubeFaceSize*2+(y-cubeFaceSize)] = height;
                colorPixel(height, cubeFaceSize+x, cubeFaceSize*2+(y-cubeFaceSize), colorScale, ctx);
            }                
        }
    }
}

function generateCubeMapTexture(cubeFaceSize, noiseScale, isColorScaleDistinct) {
    
    /** @type {Canvas2DRenderingContext} */
    const mc = document.createElement("canvas")
    const ctx = mc.getContext("2d");

    mc.height = cubeFaceSize*3;
    mc.width = cubeFaceSize*4;

    noiseScale = noiseScale || Math.random(); // Best results ]0,1]
    isColorScaleDistinct = isColorScaleDistinct || false;
    
    // Creating palette
    var colorScale = generatePalette(isColorScaleDistinct);

    ctx.clearRect(0,0,cubeFaceSize*4,cubeFaceSize*3);
    cubeMapNoiseGenerator(cubeFaceSize, noiseScale, 1, colorScale, ctx);

    var img = new Image();
    img.src = mc.toDataURL('image/png');
    return img;

}





