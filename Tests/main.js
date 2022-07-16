window.onload = function main() { 
    /*============= Creating a canvas ======================*/ 
    var canvas = document.getElementById('my_Canvas');
    gl = canvas.getContext('webgl');
    var faceCubeSize=256;

    /*========== Defining and storing the geometry ==========*/
    // Create programs
    var skyboxProgram = webglUtils.createProgramInfo(gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
    var planetProgram = webglUtils.createProgramInfo(gl, ["planet-vertex-shader", "planet-fragment-shader"]);
    var starshipProgram = webglUtils.createProgramInfo(gl, ["ship-vertex-shader", "ship-fragment-shader"]);
    var sunProgram = webglUtils.createProgramInfo(gl, ["sun-vertex-shader", "sun-fragment-shader"]);

    // Create Skybox buffer and fill with data
    const skyboxData = createXYQuadVertices.apply(null,  Array.prototype.slice.call(arguments, 1));
    const skyboxInfo = webglUtils.createBufferInfoFromArrays(gl, skyboxData);

    // Create planet buffer and fill with data
    const sphereData = createSphereVertices.apply(null,  Array.prototype.slice.call(arguments, 1));
    const sphereInfo = webglUtils.createBufferInfoFromArrays(gl, sphereData);

    // Create starship buffer from blender mesh loading
    var mesh = new Array();
    mesh.sourceMesh = '../Spaceship/spaceship.obj';
    var meshData = loadMesh(gl, mesh);
    const starshipData = meshData.data.apply(null,  Array.prototype.slice.call(arguments, 1));
    const starshipInfo = webglUtils.createBufferInfoFromArrays(gl, starshipData);

    
    // Texture definition
    const planetTexture1 = loadPlanetTexture(gl, document, faceCubeSize);
    const planetTexture2 = loadPlanetTexture(gl, document, faceCubeSize);
    const sunTexture = loadSunTexture(gl);
    const skyboxTexture = loadSkyboxTexture(gl);
    const starshipTexture = meshData.texture;

    /*====== DEFINE GUI =======*/
    define_gui();
    

    /*==================== MATRIX INFO ====================== */

    function degToRad(d) {
    return d * Math.PI / 180;
    }

    //usa libreria m4.js per definire proj_matrix
        var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        var zNear = 1;
        var zFar = 100;
        var fov = 40;
        var proj_matrix = m4.perspective(degToRad(fov), aspect, zNear, zFar);
    //console.log(proj_matrix);

    //usa libreria m4.js per definire view_matrix
        var THETA=0, PHI=0;
    
    // temporary mov matrix definition
    /*================= Mouse events ======================*/
    var AMORTIZATION=0.95;
    var drag=false;
    var old_x, old_y;
    var dX=0, dY=0;

    var mouseDown=function(e) {
        drag=true;
        old_x=e.pageX, old_y=e.pageY;
        e.preventDefault();
        return false;
    };
    var mouseUp=function(e){
    drag=false;
    };
    var mouseMove=function(e) {
    if (!drag) return false; 
    dX=(e.pageX-old_x)*2*Math.PI/canvas.width, 
    dY=(e.pageY-old_y)*2*Math.PI/canvas.height; 
    THETA+=dX;
    PHI+=dY;
    old_x=e.pageX, old_y=e.pageY; 
    e.preventDefault();
    };

    canvas.onmousedown=mouseDown;
    canvas.onmouseup=mouseUp;
    canvas.mouseout=mouseUp;
    canvas.onmousemove=mouseMove;

    

    /*=================== Drawing =================== */
    var time_old=0;
    var orbitAngle1 = 0;
    var orbitAngle2 = 0;
    var rotationAngle1 = 0;
    var rotationAngle2 = 0;
    var orbitDirection1 = 1;  // 1 or -1
    var orbitDirection2 = -1;
    var sunlightPosition = [0,0,0];

    var render=function(time) {

    var dt=time-time_old;

        if (!drag) {
            dX*=AMORTIZATION, dY*=AMORTIZATION;
            THETA+=dX, PHI+=dY;
        }
    
    updatePlanetAngles = function(orbitAngle, orbitSpeed, rotationAngle, rotationSpeed) {

        if((orbitAngle + dt*0.01) >= 360) {
            orbitAngle = 360 - (orbitAngle+dt*orbitSpeed);
        }
        else {
            orbitAngle += dt*orbitSpeed;
        }

        if((rotationAngle + dt*0.01) >= 360) {
            rotationAngle = 360 - (rotationAngle+dt*rotationSpeed);
        }
        else {
            rotationAngle += dt*rotationSpeed;
        }

        return {
            orbitAngle: orbitAngle,
            rotationAngle: rotationAngle,
        }
    }

    var camera = [controls.D*Math.sin(PHI)*Math.cos(THETA),
                  controls.D*Math.sin(PHI)*Math.sin(THETA),
                  controls.D*Math.cos(PHI)];
    //    console.log(camera);

    var target = [0, 0, 0];
    if (controls.targetShip) {
        target = [2,0,2]; //TEMPORARY
    }
    var up = [0, 1, 0];
    var view_matrix = m4.inverse(m4.lookAt(camera, target, up));
    //    console.log(view_matrix);

    var viewDirectionMatrix = m4.copy(view_matrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(proj_matrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    time_old=time;          
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); 
    gl.clearColor(0.75, 0.75, 0.75, 1); 
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, canvas.width, canvas.height); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    /*============ Draw Skybox ============*/
    gl.useProgram(skyboxProgram.program);

    webglUtils.setBuffersAndAttributes(gl, skyboxProgram, skyboxInfo);
    webglUtils.setUniforms(skyboxProgram, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: skyboxTexture,
    });
    webglUtils.drawBufferInfo(gl, skyboxInfo);

    /*============ Draw Planet 1 ============*/
    gl.useProgram(planetProgram.program);

    // Move planet 1
    mo_matrix=[];
    m4.identity(mo_matrix);
    var planetAngles = updatePlanetAngles(orbitAngle1, controls.orbitSpeed1, rotationAngle1, controls.rotationSpeed1);
    orbitAngle1 = planetAngles.orbitAngle;
    rotationAngle1 = planetAngles.rotationAngle;
    
    mo_matrix=m4.translate(mo_matrix, 
        controls.orbitRadius1*Math.cos(degToRad(orbitDirection1*orbitAngle1)) , 
        0, 
        controls.orbitRadius1*Math.sin(degToRad(orbitDirection1*orbitAngle1)));
    
    mo_matrix=m4.yRotate(mo_matrix, degToRad(rotationAngle1)); // Rotate the planet

    var u_worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture1);  

    webglUtils.setBuffersAndAttributes(gl, planetProgram, sphereInfo);
    webglUtils.setUniforms(planetProgram, {
      u_projection: proj_matrix,
      u_view: view_matrix,
      u_world: mo_matrix,
      u_lightWorldPosition: sunlightPosition,
      u_worldInverseTransposeMatrix: u_worldInverseTransposeMatrix, 
      u_texture: planetTexture1,
    });
    webglUtils.drawBufferInfo(gl, sphereInfo);

    /*============ Draw Planet 2 ============*/

    // Move planet 2
    var mo_matrix=[];
    m4.identity(mo_matrix);
    planetAngles = updatePlanetAngles(orbitAngle2, controls.orbitSpeed2, rotationAngle2, controls.rotationSpeed2);
    orbitAngle2 = planetAngles.orbitAngle;
    rotationAngle2 = planetAngles.rotationAngle;
    
    mo_matrix=m4.translate(mo_matrix, 
        controls.orbitRadius2*Math.cos(degToRad(orbitDirection2*orbitAngle2)) , 
        0, 
        controls.orbitRadius2*Math.sin(degToRad(orbitDirection2*orbitAngle2)));
    
    mo_matrix=m4.yRotate(mo_matrix, degToRad(rotationAngle2)); // Rotate the planet

    u_worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture2); 

    webglUtils.setBuffersAndAttributes(gl, planetProgram, sphereInfo);
    webglUtils.setUniforms(planetProgram, {
        u_projection: proj_matrix,
        u_view: view_matrix,
        u_world: mo_matrix,
        u_lightWorldPosition: sunlightPosition,
        u_worldInverseTransposeMatrix: u_worldInverseTransposeMatrix, 
        u_texture: planetTexture2,
      });
      webglUtils.drawBufferInfo(gl, sphereInfo);

    /*============ Draw Sun ============*/
    gl.bindTexture(gl.TEXTURE_2D, sunTexture);

    gl.useProgram(sunProgram.program);

    //Reset mo_matrix
    mo_matrix = [];
    mo_matrix = m4.identity(mo_matrix);
    mo_matrix = m4.scale(mo_matrix, 1.5, 1.5, 1.5);

    webglUtils.setBuffersAndAttributes(gl, sunProgram, sphereInfo);
    webglUtils.setUniforms(sunProgram, {
      u_projection: proj_matrix,
      u_view: view_matrix,
      u_world: mo_matrix,
      u_texture: sunTexture,
    });
    webglUtils.drawBufferInfo(gl, sphereInfo);

    /*========== Draw Starship =========*/
    gl.bindTexture(gl.TEXTURE_2D, starshipTexture);

    gl.useProgram(starshipProgram.program);

    //Reset mo_matrix
    mo_matrix = [];
    mo_matrix = m4.identity(mo_matrix);
    mo_matrix = m4.translate(mo_matrix, 2,0,2);
    mo_matrix = m4.scale(mo_matrix, 0.3,0.3,0.3);

    webglUtils.setBuffersAndAttributes(gl, starshipProgram, starshipInfo);
    webglUtils.setUniforms(starshipProgram, {
      u_projection: proj_matrix,
      u_view: view_matrix,
      u_world: mo_matrix,
      u_viewWorldPosition: camera,
      diffuse: meshData.parameters.diffuse,
      ambient: meshData.parameters.ambient,
      emissive: meshData.parameters.emissive,
      specular: meshData.parameters.specular,
      shininess: meshData.parameters.shininess,
      opacity: meshData.parameters.opacity,
      u_lightDirection: sunlightPosition,
      u_ambientLight: [0, 0, 0],
      u_diffuseMap: starshipTexture,
    });
    webglUtils.drawBufferInfo(gl, starshipInfo);



    window.requestAnimationFrame(render); 
    }

    render(0);
}



var controls = {
    orbitRadius1 : 4,
    orbitRadius2 : 8,
    orbitSpeed1 : 0.01,
    orbitSpeed2 : 0.005,
    rotationSpeed1 : 0.05,
    rotationSpeed2 : 0.02,
    D: 10,
    targetShip: false,
}

function define_gui(){
    var gui = new dat.GUI();
    
    gui.add(controls,"orbitRadius1").min(1).max(10).step(1).listen().onChange(function() {
        render(0);});
    gui.add(controls,"orbitRadius2").min(1).max(10).step(1).listen().onChange(function() {
        render(0);});
    gui.add(controls,"orbitSpeed1").min(0.001).max(0.1).step(0.001).listen().onChange(function() {
        render(0);});
    gui.add(controls,"orbitSpeed2").min(0.001).max(0.1).step(0.001).listen().onChange(function() {
        render(0);});
    gui.add(controls,"rotationSpeed1").min(0.01).max(1).step(0.01).listen().onChange(function() {
        render(0);});
    gui.add(controls,"rotationSpeed2").min(0.01).max(1).step(0.01).listen().onChange(function() {
        render(0);});
    gui.add(controls,"D").min(0).max(20).step(1).listen().onChange(function() {
        render(0);});
    gui.add(controls, "targetShip");
}




