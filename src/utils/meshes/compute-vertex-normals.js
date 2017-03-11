"use strict";

var normalizeNormals = function (normals) {
    var i, x, y, z, n;

    for ( i = 0; i < normals.length; i += 3 ) {
        x = normals[i];
        y = normals[i + 1];
        z = normals[i + 2];

        n = 1.0 / Math.sqrt( x * x + y * y + z * z );

        normals[i] *= n;
        normals[i + 1] *= n;
        normals[i + 2] *= n;
    }

};

var computeHeightMapNormals = function (heightmap, width, height, normals) {
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            var ty = y + 1;
            var tx = x + 1;

            var P = heightmap[ty * (width + 2) + tx];

            var vEx = tx;
            var vWx = tx;
            var vNx = tx + 1;
            var vSx = x;

            var vEy = y;
            var vWy = ty + 1;
            var vNy = ty;
            var vSy = ty;

            var vEz = heightmap[vEy * (width + 2) + vEx] - P;
            var vWz = heightmap[vWy * (width + 2) + vWx] - P;
            var vNz = heightmap[vNy * (width + 2) + vNx] - P;
            var vSz = heightmap[vSy * (width + 2) + vSx] - P;

            /*
            vEz*= -1;
            vWz*= -1;
            vNz*= -1;
            vSz*= -1;
            */

            vEx*= 90*64/width;
            vWx*= 90*64/width;
            vNx*= 90*64/width;
            vSx*= 90*64/width;

            vEy*= 90*64/width;
            vWy*= 90*64/width;
            vNy*= 90*64/width;
            vSy*= 90*64/width;

            /*
            var _vEx = vEx,
                _vWx = vWx,
                _vNx = vNx,
                _vSx = vSx;

            vEx = vEy;
            vWx = vWy;
            vNx = vNy;
            vSx = vSy;

            vEy = _vEx;
            vWy = _vWx;
            vNy = _vNx;
            vSy = _vSx;
            */

            /*
            A.cross(B);

             R+= A[1] * B[2] - A[2] * B[1];
             G+= A[2] * B[0] - A[0] * B[2];
             B+= A[0] * B[1] - A[1] * B[0];
             */

            var R = 0;
            var G = 0;
            var B = 0;

            //vN.cross(vE)

            R+=vNy * vEz - vNz * vEy;
            G+=vNz * vEx - vNx * vEz;
            B+=vNx * vEy - vNy * vEx;

            //vE.cross(vS)

            R+= vEy * vSz - vEz * vSy;
            G+= vEz * vSx - vEx * vSz;
            B+= vEx * vSy - vEy * vSx;

            //vS.cross(vW)

            R+= vSy * vWz - vSz * vWy;
            G+= vSz * vWx - vSx * vWz;
            B+= vSx * vWy - vSy * vWx;

            //vW.cross(vN)

            R+= vWy * vNz - vWz * vNy;
            G+= vWz * vNx - vWx * vNz;
            B+= vWx * vNy - vWy * vNx;

            normals[3 * (y * width + x)] = R/-4;
            normals[3 * (y * width + x) + 1] = B/-4;
            normals[3 * (y * width + x) + 2] = G/-4;
        }
    }

    normalizeNormals(normals);
};

var computeVertexNormals = function (indices, positions, normals) {
    var pA = [0,0,0],
        pB = [0,0,0],
        pC = [0,0,0],
        cb = [0,0,0],
        ab = [0,0,0],
        vA,
        vB,
        vC,
        cbx,
        cby,
        cbz,
        i;

    if (indices) {
        for (i = 0; i < indices.length; i += 3) {

            vA = indices[i] * 3;
            vB = indices[i + 1] * 3;
            vC = indices[i + 2] * 3;

            /*
             pA.fromArray( positions, vA );
             pB.fromArray( positions, vB );
             pC.fromArray( positions, vC );
             */

            pA[0] = positions[vA];
            pA[1] = positions[vA + 1];
            pA[2] = positions[vA + 2];

            pB[0] = positions[vB];
            pB[1] = positions[vB + 1];
            pB[2] = positions[vB + 2];

            pC[0] = positions[vC];
            pC[1] = positions[vC + 1];
            pC[2] = positions[vC + 2];

            /*
             cb.subVectors( pC, pB );
             ab.subVectors( pA, pB );
             */

            cb[0] = pC[0] - pB[0];
            cb[1] = pC[1] - pB[1];
            cb[2] = pC[2] - pB[2];

            ab[0] = pA[0] - pB[0];
            ab[1] = pA[1] - pB[1];
            ab[2] = pA[2] - pB[2];

            /*
             cb.cross( ab );
             */

            cbx = cb[0];
            cby = cb[1];
            cbz = cb[2];

            cb[0] = cby * ab[2] - cbz * ab[1];
            cb[1] = cbz * ab[0] - cbx * ab[2];
            cb[2] = cbx * ab[1] - cby * ab[0];

            normals[vA] += cb[0];
            normals[vA + 1] += cb[1];
            normals[vA + 2] += cb[2];

            normals[vB] += cb[0];
            normals[vB + 1] += cb[1];
            normals[vB + 2] += cb[2];

            normals[vC] += cb[0];
            normals[vC + 1] += cb[1];
            normals[vC + 2] += cb[2];

        }
    } else {
        for (i = 0; i < positions.length; i += 9) {

            /*
             pA.fromArray( positions, i );
             pB.fromArray( positions, i + 3 );
             pC.fromArray( positions, i + 6 );
             */

            pA[0] = positions[i];
            pA[1] = positions[i + 1];
            pA[2] = positions[i + 2];

            pB[0] = positions[i + 3];
            pB[1] = positions[i + 4];
            pB[2] = positions[i + 5];

            pC[0] = positions[i + 6];
            pC[1] = positions[i + 7];
            pC[2] = positions[i + 8];

            /*
             cb.subVectors( pC, pB );
             ab.subVectors( pA, pB );
             */

            cb[0] = pC[0] - pB[0];
            cb[1] = pC[1] - pB[1];
            cb[2] = pC[2] - pB[2];

            ab[0] = pA[0] - pB[0];
            ab[1] = pA[1] - pB[1];
            ab[2] = pA[2] - pB[2];

            /*
             cb.cross( ab );
             */

            cbx = cb[0];
            cby = cb[1];
            cbz = cb[2];

            cb[0] = cby * ab[2] - cbz * ab[1];
            cb[1] = cbz * ab[0] - cbx * ab[2];
            cb[2] = cbx * ab[1] - cby * ab[0];

            normals[ i ] = cb[0];
            normals[ i + 1 ] = cb[1];
            normals[ i + 2 ] = cb[2];

            normals[ i + 3 ] = cb[0];
            normals[ i + 4 ] = cb[1];
            normals[ i + 5 ] = cb[2];

            normals[ i + 6 ] = cb[0];
            normals[ i + 7 ] = cb[1];
            normals[ i + 8 ] = cb[2];
        }
    }

    normalizeNormals(normals);
};

module.exports = computeVertexNormals;
module.exports.fromHeightMap = computeHeightMapNormals;
