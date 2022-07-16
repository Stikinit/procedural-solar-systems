//Funzione che carica una texture
   function loadTexture(gl, path, fileName) {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
               width, height, border, srcFormat, srcType, pixel);
      
      if(fileName){
         const image = new Image();
         image.onload = function() {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) 
                gl.generateMipmap(gl.TEXTURE_2D); // Yes, it's a power of 2. Generate mips.
            else {
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
               gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            }
         };
         image.src = path + fileName;
      }
      return texture;
      
      function isPowerOf2(value) {
         return (value & (value - 1)) == 0;
      }
   }
   
//Funzione che utilizza la libreria glm_utils per leggere un eventuale 
//file MTL associato alla mesh
	function readMTLFile(MTLfileName, mesh){
		return $.ajax({
			type: "GET",
			url: MTLfileName,
			dataType: "text",
			async: false,
			success: parseMTLFile,
			error: handleError,
		});
		function parseMTLFile(result, status, xhr){
			glmReadMTL(result, mesh);
		}
		function handleError(jqXhr, textStatus, errorMessage){
			console.error('Error : ' + errorMessage);
		}
	}

//Funzione che serve per recuperare i dati della mesh da un file OBJ
	function retrieveDataFromSource(mesh){
      loadMeshFromOBJ(mesh);
      if(mesh.fileMTL) {
         readMTLFile(mesh.sourceMesh.substring(0, mesh.sourceMesh.lastIndexOf("/")+1) + mesh.fileMTL, mesh.data); 
         mesh.materials = mesh.data.materials;
         delete mesh.data.materials;
      }
   }

//Funzione che utilizza la libreria glm_utils per leggere un file OBJ 
//contenente la definizione della mesh
   function loadMeshFromOBJ(mesh) {
      return $.ajax({
         type: "GET",
         url: mesh.sourceMesh,
         dataType: "text",
         async: false,
         success: parseobjFile,
         error: handleError,
      });
      function parseobjFile(result, status, xhr){                  
         var result = glmReadOBJ(result,new subd_mesh());
//scommentare/commentare per utilizzare o meno la LoadSubdivMesh
//         mesh.data = LoadSubdivMesh(result.mesh);
         mesh.data = result.mesh;
         mesh.fileMTL = result.fileMtl;
      }	
      function handleError(jqXhr, textStatus, errorMessage){
         console.error('Error : ' + errorMessage);
      }
   } 

/*========== Loading and storing the geometry ==========*/
   function loadMesh(gl,mesh) {

      retrieveDataFromSource(mesh);
      Unitize(mesh.data);
  //Ora che ho la mesh e il/i materiali associati, mi occupo di caricare 
  //la/le texture che tali materiali contengono
      var map = mesh.materials[1].parameter;
      var path = mesh.sourceMesh.substring(0, mesh.sourceMesh.lastIndexOf("/")+1);
      map.set("map_Kd", loadTexture(gl, path, map.get("map_Kd")));

     var x=[], y=[], z=[];
     var xt=[], yt=[];
     var i0,i1,i2;
     var ambient, diffuse, specular, emissive, shininess, opacity;
     var nvert=mesh.data.nvert;
     var nface=mesh.data.nface;
     var ntexcoord=mesh.data.textCoords.length;
     var numVertices=3*nface;
     var positions=[], normals=[], texcoords=[];

     for (var i=0; i<nvert; i++){
        x[i]=mesh.data.vert[i+1].x;
        y[i]=mesh.data.vert[i+1].y;
        z[i]=mesh.data.vert[i+1].z;       
      }
     for (var i=0; i<ntexcoord-1; i++){
        xt[i]=mesh.data.textCoords[i+1].u;
        yt[i]=mesh.data.textCoords[i+1].v;      
     }
     for (var i=1; i<=nface; i++){
       i0=mesh.data.face[i].vert[0]-1;
       i1=mesh.data.face[i].vert[1]-1;
       i2=mesh.data.face[i].vert[2]-1;
       positions.push(x[i0],y[i0],z[i0],x[i1],y[i1],z[i1],x[i2],y[i2],z[i2]); 
       i0=mesh.data.facetnorms[i].i;
       i1=mesh.data.facetnorms[i].j;
       i2=mesh.data.facetnorms[i].k;
       normals.push(i0,i1,i2,i0,i1,i2,i0,i1,i2); 
       i0=mesh.data.face[i].textCoordsIndex[0]-1;
       i1=mesh.data.face[i].textCoordsIndex[1]-1;
       i2=mesh.data.face[i].textCoordsIndex[2]-1;
       texcoords.push(xt[i0],yt[i0],xt[i1],yt[i1],xt[i2],yt[i2]);
     }         


    if (mesh.fileMTL == null){
      ambient=mesh.materials[0].parameter.get("Ka");
      diffuse=mesh.materials[0].parameter.get("Kd");
      specular=mesh.materials[0].parameter.get("Ks");
      emissive=mesh.materials[0].parameter.get("Ke");
      shininess=mesh.materials[0].parameter.get("Ns");
      opacity=mesh.materials[0].parameter.get("Ni");
    }
    else{
      ambient=mesh.materials[1].parameter.get("Ka");
      diffuse=mesh.materials[1].parameter.get("Kd");
      specular=mesh.materials[1].parameter.get("Ks");
      emissive=mesh.materials[1].parameter.get("Ke");
      shininess=mesh.materials[1].parameter.get("Ns");
      opacity=mesh.materials[1].parameter.get("Ni");
    }

    return {
      data: function() {
         return {         
            position: {
               numComponents: 3,
               data: positions,
            },
            normal: normals,
            texcoord: texcoords,
         }
      },
      parameters: {
         ambient: ambient,
         diffuse: diffuse,
         specular: specular,
         emissive: emissive,
         shininess: shininess,
         opacity: opacity,
      },
      texture: map.get("map_Kd"),
    }
    

}
