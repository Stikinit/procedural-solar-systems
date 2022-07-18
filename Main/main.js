window.onload = function main() { 
    /*============= Creating a 3d canvas and an overlay canvas ======================*/
    var canvas = document.querySelector('#my_Canvas');
    gl = canvas.getContext('webgl');
    var faceCubeSize=256;

    var overlay_canvas = document.querySelector("#overlay_Canvas") 
    var ctx = overlay_canvas.getContext("2d");
    ctx.fillStyle = "rgba(255,255,255,0)"; // Transparent canvas  

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
    const planetTexture3 = loadPlanetTexture(gl, document, faceCubeSize);
    const moonTexture = loadFaceTexture(gl);
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
        if (e.keyCode == 87) key[0]=true; //W
        if (e.keyCode == 83) key[2]=true; //S
        if (e.keyCode == 65) key[1]=true; //A
        if (e.keyCode == 68) key[3]=true; //D
        if (e.keyCode == 38) key[6]=true; //Arrow up
        if (e.keyCode == 40) key[7]=true; //Arrow down
        if (e.keyCode == 37) key[8]=true; //Arrow left
        if (e.keyCode == 39) key[9]=true; //Arrow right
    }
    function doKeyUp(e){
        if (e.keyCode == 87) key[0]=false; //W
        if (e.keyCode == 83) key[2]=false; //S
        if (e.keyCode == 65) key[1]=false; //A
        if (e.keyCode == 68) key[3]=false; //D
        if (e.keyCode == 38) key[6]=false; //Arrow up
        if (e.keyCode == 40) key[7]=false; //Arrow down
        if (e.keyCode == 37) key[8]=false; //Arrow left
        if (e.keyCode == 39) key[9]=false; //Arrow right
    }

    var lastTouch;

    function doTouch(evt) {
        for(var i=0; i<evt.touches.length; i++) {
            var e = evt.touches[i];
            if (e.clientX >= ctx.canvas.width*1/9 && e.clientX <= ctx.canvas.width*2/9 && e.clientY >= ctx.canvas.height/2 && e.clientY <= ctx.canvas.height*4/6) key[0]=true; //W
            else if (e.clientX >= ctx.canvas.width*1/9 && e.clientX <= ctx.canvas.width*2/9 && e.clientY >= ctx.canvas.height*5/6 && e.clientY <= ctx.canvas.height) key[2]=true; //S
            else if (e.clientX >= 0 && e.clientX <= ctx.canvas.width*1/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[1]=true; //A
            else if (e.clientX >= ctx.canvas.width*2/9 && e.clientX <= ctx.canvas.width*3/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[3]=true; //D
            else if (e.clientX >= ctx.canvas.width*7/9 && e.clientX <= ctx.canvas.width*8/9 && e.clientY >= ctx.canvas.height/2 && e.clientY <= ctx.canvas.height*4/6) key[6]=true; //Arrow up
            else if (e.clientX >= ctx.canvas.width*7/9 && e.clientX <= ctx.canvas.width*8/9 && e.clientY >= ctx.canvas.height*5/6 && e.clientY <= ctx.canvas.height) key[7]=true; //Arrow down
            else if (e.clientX >= ctx.canvas.width*6/9 && e.clientX <= ctx.canvas.width*7/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[8]=true; //Arrow left
            else if (e.clientX >= ctx.canvas.width*8/9 && e.clientX <= ctx.canvas.width && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[9]=true; //Arrow right
            else {lastTouch = e; drag=true;} // Outside of layout => camera change
        }
        evt.preventDefault();
    }

    function doEndTouch(evt) {
        drag=false;
        for(var i=0; i<evt.changedTouches.length; i++) {
            var e = evt.changedTouches[i];
            if (e.clientX >= ctx.canvas.width*1/9 && e.clientX <= ctx.canvas.width*2/9 && e.clientY >= ctx.canvas.height/2 && e.clientY <= ctx.canvas.height*4/6) key[0]=false; //W
            if (e.clientX >= ctx.canvas.width*1/9 && e.clientX <= ctx.canvas.width*2/9 && e.clientY >= ctx.canvas.height*5/6 && e.clientY <= ctx.canvas.height) key[2]=false; //S
            if (e.clientX >= 0 && e.clientX <= ctx.canvas.width*1/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[1]=false; //A
            if (e.clientX >= ctx.canvas.width*2/9 && e.clientX <= ctx.canvas.width*3/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[3]=false; //D

            if (e.clientX >= ctx.canvas.width*7/9 && e.clientX <= ctx.canvas.width*8/9 && e.clientY >= ctx.canvas.height/2 && e.clientY <= ctx.canvas.height*4/6) key[6]=false; //Arrow up
            if (e.clientX >= ctx.canvas.width*7/9 && e.clientX <= ctx.canvas.width*8/9 && e.clientY >= ctx.canvas.height*5/6 && e.clientY <= ctx.canvas.height) key[7]=false; //Arrow down
            if (e.clientX >= ctx.canvas.width*6/9 && e.clientX <= ctx.canvas.width*7/9 && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[8]=false; //Arrow left
            if (e.clientX >= ctx.canvas.width*8/9 && e.clientX <= ctx.canvas.width && e.clientY >= ctx.canvas.height*4/6 && e.clientY <= ctx.canvas.height*5/6) key[9]=false; //Arrow right
        }
        evt.preventDefault();
    }
    
    function doMoveTouch(evt) {
        if (!drag) return false;
        for(var i=0; i<evt.changedTouches.length; i++) {
            if (evt.changedTouches[i].identifier == lastTouch.identifier) {
                var changedTouch = evt.changedTouches[i];
                dX=(changedTouch.clientX-lastTouch.clientX)*2*Math.PI/canvas.width, 
                dY=(changedTouch.clientY-lastTouch.clientY)*2*Math.PI/canvas.height; 
                THETA+=dX;
                PHI+=dY;
                lastTouch = changedTouch;
            }
        }
        evt.preventDefault();
    }

    //We don't want to trigger scrolling of any type
    window.addEventListener("keydown", function(e) {
        if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, false);

    overlay_canvas.onmousedown=mouseDown;
    overlay_canvas.onmouseup=mouseUp;
    overlay_canvas.mouseout=mouseUp;
    overlay_canvas.onmousemove=mouseMove;
    window.addEventListener('keydown', doKeyDown, true);
    window.addEventListener('keyup', doKeyUp, true);
    overlay_canvas.addEventListener('touchstart', doTouch, false);
    overlay_canvas.addEventListener('touchend', doEndTouch, false);
    overlay_canvas.addEventListener('touchmove', doMoveTouch, false);

    /*=================== Drawing =================== */
    var time_old=0;
    var orbitAngle1 = 0;
    var orbitAngle2 = 0;
    var orbitAngle3 = 0;
    var orbitAngleMoon = 0;
    var rotationAngle1 = 0;
    var rotationAngle2 = 0;
    var rotationAngle3 = 0;
    var rotationAngleMoon = 0;
    var orbitDirection1 = 1;  // 1 or -1
    var orbitDirection2 = -1;
    var orbitDirection3 = 1;
    var orbitDirectionMoon = -1;
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
        var camera = [0.4*Math.sin(degToRad(shipParams.dynamic.yaw)) + shipParams.dynamic.px, // Follow the ship
                        0.1 + shipParams.dynamic.py,
                        0.4*Math.cos(degToRad(shipParams.dynamic.yaw)) + shipParams.dynamic.pz];
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
        controls.inclination1*controls.orbitRadius1*Math.sin(degToRad(orbitDirection1*orbitAngle1)), 
        controls.orbitRadius1*Math.sin(degToRad(orbitDirection1*orbitAngle1)));
    
    moon_matrix = mo_matrix;
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

    /*========= Draw Moon ==========*/
    // Translate the mov matrix again for moon movement around the planet
    planetAngles = updatePlanetAngles(orbitAngleMoon, controls.orbitSpeedMoon, rotationAngleMoon, controls.rotationSpeedMoon);
    orbitAngleMoon = planetAngles.orbitAngle;
    rotationAngleMoon = planetAngles.rotationAngle;

    mo_matrix=m4.translate(moon_matrix, 
        Math.cos(degToRad(orbitDirectionMoon*orbitAngleMoon)) , 
        Math.sin(degToRad(orbitDirectionMoon*orbitAngleMoon)), 
        Math.sin(degToRad(orbitDirectionMoon*orbitAngleMoon)));
    mo_matrix=m4.yRotate(mo_matrix, degToRad(rotationAngleMoon)); // Rotate the moon
    mo_matrix=m4.scale(mo_matrix, 0.3,0.3,0.3);

    u_worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, moonTexture); 

    webglUtils.setBuffersAndAttributes(gl, planetProgram, sphereInfo);
    webglUtils.setUniforms(planetProgram, {
      u_projection: proj_matrix,
      u_view: view_matrix,
      u_world: mo_matrix,
      u_lightWorldPosition: sunlightPosition,
      u_worldInverseTransposeMatrix: u_worldInverseTransposeMatrix, 
      u_texture: moonTexture,
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
        controls.inclination2*controls.orbitRadius2*Math.cos(degToRad(orbitDirection2*orbitAngle2)), 
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


      /*============ Draw Planet 3 ============*/

    // Move planet 3
    var mo_matrix=[];
    m4.identity(mo_matrix);
    planetAngles = updatePlanetAngles(orbitAngle3, controls.orbitSpeed3, rotationAngle3, controls.rotationSpeed3);
    orbitAngle3 = planetAngles.orbitAngle;
    rotationAngle3 = planetAngles.rotationAngle;
    
    mo_matrix=m4.translate(mo_matrix, 
        controls.orbitRadius3*Math.cos(degToRad(orbitDirection3*orbitAngle3)) , 
        controls.inclination3*controls.orbitRadius3*Math.sin(degToRad(orbitDirection3*orbitAngle3)), 
        controls.orbitRadius3*Math.sin(degToRad(orbitDirection3*orbitAngle3)));
    
    mo_matrix=m4.yRotate(mo_matrix, degToRad(rotationAngle3)); // Rotate the planet

    u_worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix));

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture3); 

    webglUtils.setBuffersAndAttributes(gl, planetProgram, sphereInfo);
    webglUtils.setUniforms(planetProgram, {
        u_projection: proj_matrix,
        u_view: view_matrix,
        u_world: mo_matrix,
        u_lightWorldPosition: sunlightPosition,
        u_worldInverseTransposeMatrix: u_worldInverseTransposeMatrix, 
        u_texture: planetTexture3,
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
    mo_matrix=m4.yRotate(mo_matrix, degToRad(shipParams.dynamic.yaw));
    mo_matrix=m4.scale(mo_matrix, 0.1,0.1,0.1);

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


        if (controls.onMobile) {
            drawDPads(ctx);
        }
        else { ctx.clearRect(0, 0, canvas.width, canvas.height); }
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
        yaw: 0,
        steering_pos: 0, // Position of steering changes
        vx: 0,
        vy: 0,
        vz: 0,
    },
    static: {
        steering_strength: 8.0,
        backsteering_strength: 0.89,
        acc: 0.005,
        inertia_dampeners: 0.9,
        yaw_strength: 3.0,
    }
}

var key = [false, false, false, false, false, false, false, false, false, false];

function moveStarship(){
    var vxm, vym, vzm; // speed in starship space

    // Transform world speeds to starship speeds
    var cosf = Math.cos(shipParams.dynamic.yaw*Math.PI/180.0);
    var sinf = Math.sin(shipParams.dynamic.yaw*Math.PI/180.0);

    vxm = +cosf*shipParams.dynamic.vx - sinf*shipParams.dynamic.vz;
    vym = +shipParams.dynamic.vy;
    vzm = +sinf*shipParams.dynamic.vx + cosf*shipParams.dynamic.vz;

    // Steering management
    if (key[1]) shipParams.dynamic.steering_pos+=shipParams.static.steering_strength;
    if (key[3]) shipParams.dynamic.steering_pos-=shipParams.static.steering_strength;
    shipParams.dynamic.steering_pos*=shipParams.static.backsteering_strength; // ritorno a volante fermo
   
    if (key[0]) vzm-=shipParams.static.acc; // accelerazione in avanti
    if (key[2]) vzm+=shipParams.static.acc; // accelerazione indietro
    if (key[8]) vxm-=shipParams.static.acc; // accelerazione a sinistra
    if (key[9]) vxm+=shipParams.static.acc; // accelerazione a destra
    if (key[6]) vym+=shipParams.static.acc; // accelerazione in alto
    if (key[7]) vym-=shipParams.static.acc; // accelerazione in basso

   
    // Damping inertia by decreasing speed
    if (!controls.decoupled) {
        vxm*=shipParams.static.inertia_dampeners; 
        vym*=shipParams.static.inertia_dampeners;
        vzm*=shipParams.static.inertia_dampeners;  
    }

    shipParams.dynamic.yaw = shipParams.dynamic.yaw + (0.01*shipParams.static.yaw_strength)*shipParams.dynamic.steering_pos;

    // back to world speeds
    shipParams.dynamic.vx = +cosf*vxm + sinf*vzm;
    shipParams.dynamic.vy = vym;
    shipParams.dynamic.vz = -sinf*vxm + cosf*vzm;
    
    // Position
    shipParams.dynamic.px+=shipParams.dynamic.vx;
    shipParams.dynamic.py+=shipParams.dynamic.vy;
    shipParams.dynamic.pz+=shipParams.dynamic.vz;
}

function drawDPads(ctx) {
    ctx.strokeStyle = "rgb(255,255,255)";

    // LEFT DPAD UP
    ctx.strokeRect(ctx.canvas.width*1/9, ctx.canvas.height/2, ctx.canvas.width/9, ctx.canvas.height/6);
    // LEFT DPAD DOWN
    ctx.strokeRect(ctx.canvas.width*1/9, ctx.canvas.height*5/6, ctx.canvas.width/9, ctx.canvas.height/6);
    // LEFT DPAD LEFT
    ctx.strokeRect(0, ctx.canvas.height*4/6, ctx.canvas.width/9, ctx.canvas.height/6);
    // LEFT DPAD RIGHT
    ctx.strokeRect(ctx.canvas.width*2/9, ctx.canvas.height*4/6, ctx.canvas.width/9, ctx.canvas.height/6);

    // RIGHT DPAD UP
    ctx.strokeRect(ctx.canvas.width*7/9, ctx.canvas.height/2, ctx.canvas.width/9, ctx.canvas.height/6);
    // RIGHT DPAD DOWN
    ctx.strokeRect(ctx.canvas.width*7/9, ctx.canvas.height*5/6, ctx.canvas.width/9, ctx.canvas.height/6);
    // RIGHT DPAD LEFT
    ctx.strokeRect(ctx.canvas.width*6/9, ctx.canvas.height*4/6, ctx.canvas.width/9, ctx.canvas.height/6);
    //RIGHT DPAD RIGHT
    ctx.strokeRect(ctx.canvas.width*8/9, ctx.canvas.height*4/6, ctx.canvas.width/9, ctx.canvas.height/6);
}

var controls = {
    orbitRadius1 : 4,
    orbitRadius2 : 8,
    orbitRadius3: 12,
    orbitSpeed1 : 0.01,
    orbitSpeed2 : 0.005,
    orbitSpeed3 : 0.007,
    orbitSpeedMoon: 0.07,
    rotationSpeed1 : 0.05,
    rotationSpeed2 : 0.02,
    rotationSpeed3 : 0.01,
    rotationSpeedMoon : 0.08,
    inclination1 : Math.random()/2.0,
    inclination2 : Math.random()/2.0,
    inclination3 : Math.random()/2.0, 
    D: 10,
    freeCam: false,
    targetShip: true,
    onMobile: false,
    decoupled: false,
}

function define_gui(){
    var gui = new dat.GUI();
    
    gui.add(controls,"orbitRadius1").min(1).max(20).step(1).listen();
    gui.add(controls,"orbitRadius2").min(1).max(20).step(1).listen();
    gui.add(controls,"orbitRadius3").min(1).max(20).step(1).listen();
    gui.add(controls,"orbitSpeed1").min(0.001).max(0.1).step(0.001).listen();
    gui.add(controls,"orbitSpeed2").min(0.001).max(0.1).step(0.001).listen();
    gui.add(controls,"orbitSpeed3").min(0.001).max(0.1).step(0.001).listen();
    gui.add(controls,"orbitSpeedMoon").min(0.001).max(0.2).step(0.001).listen();
    gui.add(controls,"rotationSpeed1").min(0.01).max(1).step(0.01).listen();
    gui.add(controls,"rotationSpeed2").min(0.01).max(1).step(0.01).listen();
    gui.add(controls,"rotationSpeed3").min(0.01).max(1).step(0.01).listen();
    gui.add(controls,"rotationSpeedMoon").min(0.01).max(1).step(0.01).listen();
    gui.add(controls,"D").min(0.5).max(20).step(0.5).listen();
    gui.add(controls, "freeCam");
    gui.add(controls, "targetShip");
    gui.add(controls, "onMobile");
    gui.add(shipParams.static, "acc").min(0.001).max(0.1).step(0.001).listen();
    gui.add(controls, "decoupled");
}
