function createSphereVertices(){
    var radius =  0.5;
    var subdivisionsAxis = 32;
    var subdivisionsHeight = 24;
    var opt_startLatitudeInRadians,
        opt_endLatitudeInRadians,
        opt_startLongitudeInRadians,
        opt_endLongitudeInRadians;
    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
      throw Error('subdivisionAxis and subdivisionHeight must be > 0');
    }

    opt_startLatitudeInRadians = opt_startLatitudeInRadians || 0;
    opt_endLatitudeInRadians = opt_endLatitudeInRadians || Math.PI;
    opt_startLongitudeInRadians = opt_startLongitudeInRadians || 0;
    opt_endLongitudeInRadians = opt_endLongitudeInRadians || (Math.PI * 2);

    const latRange = opt_endLatitudeInRadians - opt_startLatitudeInRadians;
    const longRange = opt_endLongitudeInRadians - opt_startLongitudeInRadians;

    // We are going to generate our sphere by iterating through its
    // spherical coordinates and generating 2 triangles for each quad on a
    // ring of the sphere.
    const numVertices = (subdivisionsAxis + 1) * (subdivisionsHeight + 1);
    const positions = webglUtils.createAugmentedTypedArray(3, numVertices);
    const normals   = webglUtils.createAugmentedTypedArray(3, numVertices);
    const texCoords = webglUtils.createAugmentedTypedArray(2 , numVertices);

    // Generate the individual vertices in our vertex buffer.
    for (let y = 0; y <= subdivisionsHeight; y++) {
      for (let x = 0; x <= subdivisionsAxis; x++) {
        // Generate a vertex based on its spherical coordinates
        const u = x / subdivisionsAxis;
        const v = y / subdivisionsHeight;
        const theta = longRange * u;
        const phi = latRange * v;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const ux = cosTheta * sinPhi;
        const uy = cosPhi;
        const uz = sinTheta * sinPhi;
        positions.push(radius * ux, radius * uy, radius * uz);
        normals.push(ux, uy, uz);
        texCoords.push(1 - u, v);
      }
    }

    const numVertsAround = subdivisionsAxis + 1;
    const indices = webglUtils.createAugmentedTypedArray(3, subdivisionsAxis * subdivisionsHeight * 2, Uint16Array);
    for (let x = 0; x < subdivisionsAxis; x++) {
      for (let y = 0; y < subdivisionsHeight; y++) {
        // Make triangle 1 of quad.
        indices.push(
            (y + 0) * numVertsAround + x,
            (y + 0) * numVertsAround + x + 1,
            (y + 1) * numVertsAround + x);

        // Make triangle 2 of quad.
        indices.push(
            (y + 1) * numVertsAround + x,
            (y + 0) * numVertsAround + x + 1,
            (y + 1) * numVertsAround + x + 1);
      }
    }

    return {
      position: positions,
      normal: normals,
      texcoord: texCoords,
      indices: indices,
    };
  }

  function createXYQuadVertices() {
    var xOffset = 0;
    var yOffset = 0;
    var size = 1;
      return {
        position: {
          numComponents: 2,
          data: [
            xOffset + -1 * size, yOffset + -1 * size,
            xOffset +  1 * size, yOffset + -1 * size,
            xOffset + -1 * size, yOffset +  1 * size,
            xOffset +  1 * size, yOffset +  1 * size,
          ],
        },
        normal: [
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
          0, 0, 1,
        ],
        texcoord: [
          0, 0,
          1, 0,
          0, 1,
          1, 1,
        ],
        indices: [ 0, 1, 2, 2, 1, 3 ],
    };
}