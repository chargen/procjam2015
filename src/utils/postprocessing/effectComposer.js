var THREE = require('three'),
    CopyShader = require('./copyShader'),
    ShaderPass = require('./shaderPass'),
    MaskPass = require('./maskPass'),
    ClearMaskPass = require('./clearMaskPass');

/**
 * @author alteredq / http://alteredqualia.com/
 */

var EffectComposer = function ( renderer, renderTarget ) {

    this.renderer = renderer;

    if ( renderTarget === undefined ) {

        var pixelRatio = renderer.getPixelRatio();

        var width  = Math.floor( renderer.context.canvas.width  / pixelRatio ) || 1;
        var height = Math.floor( renderer.context.canvas.height / pixelRatio ) || 1;
        var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

        renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );

    }

    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();

    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;

    this.passes = [];

    if ( CopyShader === undefined )
        console.error( "THREE.EffectComposer relies on THREE.CopyShader" );

    this.copyPass = new ShaderPass( CopyShader );

};

EffectComposer.prototype = {

    swapBuffers: function() {

        var tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;

    },

    addPass: function ( pass ) {

        this.passes.push( pass );

    },

    insertPass: function ( pass, index ) {

        this.passes.splice( index, 0, pass );

    },

    render: function ( delta ) {

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        var maskActive = false;

        var pass, i, il = this.passes.length;

        for ( i = 0; i < il; i ++ ) {

            pass = this.passes[ i ];

            if ( !pass.enabled ) continue;

            pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

            if ( pass.needsSwap ) {

                if ( maskActive ) {

                    var context = this.renderer.context;

                    context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

                    this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

                    context.stencilFunc( context.EQUAL, 1, 0xffffffff );

                }

                this.swapBuffers();

            }

            if ( pass instanceof MaskPass ) {

                maskActive = true;

            } else if ( pass instanceof ClearMaskPass ) {

                maskActive = false;

            }

        }

    },

    reset: function ( renderTarget ) {

        if ( renderTarget === undefined ) {

            renderTarget = this.renderTarget1.clone();

            var pixelRatio = this.renderer.getPixelRatio();

            renderTarget.width  = Math.floor( this.renderer.context.canvas.width  / pixelRatio );
            renderTarget.height = Math.floor( this.renderer.context.canvas.height / pixelRatio );

        }

        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

    },

    setSize: function ( width, height ) {

        var renderTarget = this.renderTarget1.clone();

        renderTarget.width = width;
        renderTarget.height = height;

        this.reset( renderTarget );

    }

};

module.exports = EffectComposer;
