window.onload = function main() { 
    /*============= Creating a canvas ======================*/ 
    var canvas = document.getElementById('my_Canvas');
    gl = canvas.getContext('webgl');
    var faceCubeSize=256;
    var planetOrbitRadius = 3;

    /*========== Defining and storing the geometry ==========*/
    // Create programs
    var skyboxProgram = webglUtils.createProgramInfo( gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
    var shaderProgram = webglUtils.createProgramInfo(gl, ["vertex-shader", "fragment-shader"]);

    // Create Skybox buffer and fill with data
    const skyboxData = createXYQuadVertices.apply(null,  Array.prototype.slice.call(arguments, 1));
    const skyboxInfo = webglUtils.createBufferInfoFromArrays(gl, skyboxData);

    // Create planet buffer and fill with data
    const planetData = createSphereVertices.apply(null,  Array.prototype.slice.call(arguments, 1));
    const planetInfo = webglUtils.createBufferInfoFromArrays(gl, planetData);
    
    // Texture definition
    const planetTexture = loadPlanetTexture(gl, document, faceCubeSize);
    const skyboxTexture = loadSkyboxTexture(gl);
    

    /*==================== MATRIX ====================== */

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
        var THETA=0, PHI=0, D=10;
    
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
    //var THETA=0, PHI=0;
    var time_old=0;
    var orbitAngle1 = 0;
    var rotationAngle1 = 0;
    var orbitSpeed1 = 0.01;
    var rotationSpeed1 = 0.05;
    var orbitDirection1 = 1;  // 1 or -1
    var lightPosition = [0,0,0];

    var render=function(time) {

    var dt=time-time_old;
    //      document.write(time);
    //      console.log(time);
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

    //usa libreria m4.js per definire le rotazioni
    var mo_matrix=[];
    m4.identity(mo_matrix);
    var planetAngles = updatePlanetAngles(orbitAngle1, orbitSpeed1, rotationAngle1, rotationSpeed1);
    orbitAngle1 = planetAngles.orbitAngle;
    rotationAngle1 = planetAngles.rotationAngle;
    
    mo_matrix=m4.translate(mo_matrix, 
        planetOrbitRadius*Math.cos(degToRad(orbitDirection1*orbitAngle1)) , 
        0, 
        planetOrbitRadius*Math.sin(degToRad(orbitDirection1*orbitAngle1)));
    
    mo_matrix=m4.yRotate(mo_matrix, degToRad(rotationAngle1)); // Rotate the planet



    var u_worldInverseTransposeMatrix = m4.transpose(m4.inverse(mo_matrix));

    var camera = [D*Math.sin(PHI)*Math.cos(THETA),
        D*Math.sin(PHI)*Math.sin(THETA),
        D*Math.cos(PHI)];
    //    console.log(camera);
    var target = [0, 0, 0];
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

    gl.useProgram(skyboxProgram.program);

    webglUtils.setBuffersAndAttributes(gl, skyboxProgram, skyboxInfo);
    webglUtils.setUniforms(skyboxProgram, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: skyboxTexture,
    });
    webglUtils.drawBufferInfo(gl, skyboxInfo);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, planetTexture);

    gl.useProgram(shaderProgram.program);  

    webglUtils.setBuffersAndAttributes(gl, shaderProgram, planetInfo);
    webglUtils.setUniforms(shaderProgram, {
      u_projection: proj_matrix,
      u_view: view_matrix,
      u_world: mo_matrix,
      u_lightWorldPosition: lightPosition,
      u_worldInverseTransposeMatrix: u_worldInverseTransposeMatrix, 
      u_texture: planetTexture,
    });
    webglUtils.drawBufferInfo(gl, planetInfo);

    window.requestAnimationFrame(render); 
    }

    render(0);
}



/*mo_matrix2=m4.identity();
m4.yRotate(mo_matrix2, THETA, mo_matrix2);
m4.xRotate(mo_matrix2, PHI, mo_matrix2);
mo_matrix2=m4.scale(mo_matrix2, 0.75, 0.75, 0.75);
mo_matrix2=m4.translate(mo_matrix2, 2, 2, 2);
gl.uniformMatrix4fv(_Mmatrix, false, mo_matrix2);

gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);*/



