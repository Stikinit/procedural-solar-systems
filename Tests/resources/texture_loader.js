function loadPlanetTexture(gl, document, faceCubeSize) {

    /*====================== Planet Texture definition =====================*/
    // Create a texture
    const planetTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture);

    // Get A 2D context
    /** @type {Canvas2DRenderingContext} */
    const ctx = document.createElement("canvas").getContext("2d");

    ctx.canvas.width = faceCubeSize;
    ctx.canvas.height = faceCubeSize;

    //var image = new Image();
    //image.src = '../TextureGen/earth.png';
    var image = generateCubeMapTexture(faceCubeSize, 0.5);

    const faceInfosPlanet = [
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, sx: 512, sy: 256, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, sx: 0, sy: 256, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, sx: 256, sy: 0, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, sx: 256, sy: 512, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
        { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, sx: 256, sy: 256, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
        { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, sx: 768, sy: 256, sWidth: 256, sHeight: 256, dx: 0, dy: 0, dWidth: 256, dHeight: 256 },
    ];

    image.onload = function() {
        faceInfosPlanet.forEach((faceInfoPlanet) => {
            const {target, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight} = faceInfoPlanet;

            // Upload the canvas to the cubemap face.
            const level = 0;
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            
            ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            gl.texImage2D(target, level, internalFormat, format, type, ctx.canvas);
        });
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    return planetTexture;
}

function loadSkyboxTexture(gl) {

    /*====================== Skybox Texture definition =====================*/
    const skyboxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
  
    const faceInfos = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: '../skybox/left.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: '../skybox/right.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: '../skybox/top.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: '../skybox/bottom.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        url: '../skybox/front.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        url: '../skybox/back.png',
      },
    ];
  
    faceInfos.forEach((faceInfo) => {
      const {target, url} = faceInfo;
  
      // Upload the canvas to the cubemap face.
      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1024;
      const height = 1024;
      const format = gl.RGBA;
      const type = gl.UNSIGNED_BYTE;
  
      // setup each face so it's immediately renderable
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);
  
      // Asynchronously load an image
      const image = new Image();
      image.src = url;
      image.addEventListener('load', function() {
        // Now that the image has loaded make copy it to the texture.
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
        gl.texImage2D(target, level, internalFormat, format, type, image);
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      });
    });
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    return skyboxTexture;
}

function loadSunTexture(gl) {
  const sunTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sunTexture);

  const image = new Image();
  image.src = '../../TextureGen/sun.jpg';

  const target = gl.TEXTURE_2D;
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1024;
  const height = 512;
  const format = gl.RGBA;
  const type = gl.UNSIGNED_BYTE;

  // setup texture so it's immediately renderable
  gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

  image.addEventListener('load', function() {
    gl.bindTexture(gl.TEXTURE_2D, sunTexture);
    gl.texImage2D(target, level, internalFormat, format, type, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  });

  return sunTexture;
}