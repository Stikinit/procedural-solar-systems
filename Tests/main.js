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
        var zNear = 0.1;
        var zFar = 100;
        var fov = 40;
        var proj_matrix = m4.perspective(degToRad(fov), aspect, zNear, zFar);
    //console.log(proj_matrix);

    //usa libreria m4.js per definire view_matrix
        var THETA=0, PHI=0;
    



    /*================= Input events ======================*/
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

    function doKeyDown(e){
        //====================
        // THE W KEY
        //====================
        if (e.keyCode == 87) key[0]=true;
        //====================
        // THE S KEY
        //====================
        if (e.keyCode == 83) key[2]=true;
        //====================
        // THE A KEY
        //====================
        if (e.keyCode == 65) key[1]=true;
        //====================
        // THE D KEY
        //====================
        if (e.keyCode == 68) key[3]=true;
    }
    function doKeyUp(e){
        //====================
        // THE W KEY
        //====================
        if (e.keyCode == 87) key[0]=false;
        //====================
        // THE S KEY
        //====================
        if (e.keyCode == 83) key[2]=false;
        //====================
        // THE A KEY
        //====================
        if (e.keyCode == 65) key[1]=false;
        //====================
        // THE D KEY
        //====================
        if (e.keyCode == 68) key[3]=false;
    }

    canvas.onmousedown=mouseDown;
    canvas.onmouseup=mouseUp;
    canvas.mouseout=mouseUp;
    canvas.onmousemove=mouseMove;
    window.addEventListener('keydown', doKeyDown, true);
    window.addEventListener('keyup', doKeyUp, true);

    

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

    // SETUP CAMERA
    if (controls.freeCam) {
        var camera = [controls.D*Math.sin(PHI)*Math.cos(THETA) + shipParams.dynamic.px, // Follow the ship
                        controls.D*Math.sin(PHI)*Math.sin(THETA) + shipParams.dynamic.py,
                        controls.D*Math.cos(PHI) + shipParams.dynamic.pz];
    }
    else {
        var camera = [0.8*Math.sin(degToRad(shipParams.dynamic.facing)) + shipParams.dynamic.px, // Follow the ship
                        0.2 + shipParams.dynamic.py,
                        0.8*Math.cos(degToRad(shipParams.dynamic.facing)) + shipParams.dynamic.pz];
    }

    var target = [shipParams.dynamic.px, shipParams.dynamic.py, shipParams.dynamic.pz]; // Target the ship

    if (!controls.targetShip) {
        camera = [controls.D*Math.sin(PHI)*Math.cos(THETA), // Stay on the sun
                    controls.D*Math.sin(PHI)*Math.sin(THETA),
                    controls.D*Math.cos(PHI)];
        target = [0,0,0]; // Target the sun
    }
    var up = [0, 1, 0];
    var view_matrix = m4.inverse(m4.lookAt(camera, target, up));

    // SKYBOX VIEW MATRIX SETUP, WE DON'T NEED TRANSLATION INFO
    var viewDirectionMatrix = m4.copy(view_matrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(proj_matrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    // BEGIN RENDER PROCESS

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
    mo_matrix=m4.translate(mo_matrix, shipParams.dynamic.px, shipParams.dynamic.py, shipParams.dynamic.pz);
    mo_matrix=m4.yRotate(mo_matrix, degToRad(shipParams.dynamic.facing));
    mo_matrix=m4.scale(mo_matrix, 0.3,0.3,0.3);

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
      u_ambientLight: [0.01, 0.01, 0.01],
      u_diffuseMap: starshipTexture,
    });
    webglUtils.drawBufferInfo(gl, starshipInfo);



    //window.requestAnimationFrame(render); 
    }

    var nstep=0;
    const PHYS_SAMPLING_STEP=25; // numero di millisec che un passo di fisica simula
    var timeNow=0;

    function update(time){
        while(nstep*PHYS_SAMPLING_STEP <= timeNow){ //skip the frame if the call is too early
            moveStarship();
            nstep++;
        }
        timeNow=time;
        // render the frame
        render(time);
        window.requestAnimationFrame(update); // get next frame
    }

    update(0); // start animation
    window.requestAnimationFrame(update); 
}

/*=============== SHIP SYSTEMS ================*/
// init ship parameters
var shipParams = {
    dynamic: {
        px: 2,
        py: 0,
        pz: 2,
        facing: 0,
        steering_pos: 0, // Position of steering changes
        vx: 0,
        vy: 0,
        vz: 0,
    },
    static: {
        steering_strength: 8.0,
        backsteering_strength: 0.89,
        acc: 0.005,
        inertia_dampenersX: 0.9,
        inertia_dampenersY: 0.9,
        inertia_dampenersZ: 1.0,
        facing_strength: 3.0,

    }
}

var key = [false, false, false, false];

function moveStarship(){
    var vxm, vym, vzm; // speed in starship space

    // Transform world speeds to starship speeds
    var cosf = Math.cos(shipParams.dynamic.facing*Math.PI/180.0);
    var sinf = Math.sin(shipParams.dynamic.facing*Math.PI/180.0);
    vxm = +cosf*shipParams.dynamic.vx - sinf*shipParams.dynamic.vz;
    vym = shipParams.dynamic.vy;
    vzm = +sinf*shipParams.dynamic.vx + cosf*shipParams.dynamic.vz;

    // Steering management
    if (key[1]) shipParams.dynamic.steering_pos+=shipParams.static.steering_strength;
    if (key[3]) shipParams.dynamic.steering_pos-=shipParams.static.steering_strength;
    shipParams.dynamic.steering_pos*=shipParams.static.backsteering_strength; // ritorno a volante fermo
   
    if (key[0]) vzm-=shipParams.static.acc; // accelerazione in avanti
    if (key[2]) vzm+=shipParams.static.acc; // accelerazione indietro
   
    // attriti (semplificando)
    vxm*=shipParams.static.inertia_dampenersX; 
    vym*=shipParams.static.inertia_dampenersX;
    vzm*=shipParams.static.inertia_dampenersX;  

    shipParams.dynamic.facing = shipParams.dynamic.facing - (vzm*shipParams.static.facing_strength)*shipParams.dynamic.steering_pos;

    // back to world speeds
    shipParams.dynamic.vx = +cosf*vxm + sinf*vzm;
    shipParams.dynamic.vy = vym;
    shipParams.dynamic.vz = -sinf*vxm + cosf*vzm;
    
    // Position
    shipParams.dynamic.px+=shipParams.dynamic.vx;
    shipParams.dynamic.py+=shipParams.dynamic.vy;
    shipParams.dynamic.pz+=shipParams.dynamic.vz;
}

var controls = {
    orbitRadius1 : 4,
    orbitRadius2 : 8,
    orbitSpeed1 : 0.01,
    orbitSpeed2 : 0.005,
    rotationSpeed1 : 0.05,
    rotationSpeed2 : 0.02,
    D: 10,
    freeCam: false,
    targetShip: true,
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
    gui.add(controls,"D").min(1).max(20).step(1).listen().onChange(function() {
        render(0);});
    gui.add(controls, "freeCam")
    gui.add(controls, "targetShip");
}




