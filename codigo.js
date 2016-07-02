
function handleFiles(e) { 
	var file = e.target.files[0];
	var reader = new FileReader();  
	reader.addEventListener("load",processimage, false);  
	reader.readAsArrayBuffer(file); 
}

function processimage(e) { 
	var buffer = e.target.result; 
	var bitmap = getBMP(buffer); 
	var imageData = convertToImageData(bitmap); 
	Imagen = imageData;
	pintar(imageData,imageData.width,imageData.height);

}

function RGB(colores) {
	var i = 0,
		num = 0,
		indice = 0,
		rgb = [],
		maskR = 0xFF0000,
		maskG = 0x00FF00,
		maskB = 0x0000FF,
		tamColores = colores.length;

	for( i; i < tamColores; i++){
		num = colores[i];
		rgb[indice] = (num & maskR)>>16 ;
		rgb[indice+1] = (num & maskG)>>8;
		rgb[indice+2] = num & maskB;
		indice = indice + 3;
	}
	return rgb;
} 

function getBMP(buffer) { 

	var datav = new DataView(buffer); 
	var bitmap = {};

	bitmap.fileheader = {}; 
	bitmap.fileheader.bfType 	  = datav.getUint16(0, true); 
	bitmap.fileheader.bfSize 	  = datav.getUint32(2, true); 
	bitmap.fileheader.bfReserved1 = datav.getUint16(6, true); 
	bitmap.fileheader.bfReserved2 = datav.getUint16(8, true); 
	bitmap.fileheader.bfOffBits   = datav.getUint32(10, true);

	bitmap.infoheader = {};
	bitmap.infoheader.biSize 	      = datav.getUint32(14, true);
	bitmap.infoheader.biWidth 	      = datav.getUint32(18, true); 
	bitmap.infoheader.biHeight 	      = datav.getUint32(22, true); 
	bitmap.infoheader.biPlanes 	      = datav.getUint16(26, true); 
	bitmap.infoheader.biBitCount 	  = datav.getUint16(28, true); 
	bitmap.infoheader.biCompression   = datav.getUint32(30, true); 
	bitmap.infoheader.biSizeImage 	  = datav.getUint32(34, true); 
	bitmap.infoheader.biXPelsPerMeter = datav.getUint32(38, true); 
	bitmap.infoheader.biYPelsPerMeter = datav.getUint32(42, true); 
	bitmap.infoheader.biClrUsed 	  = datav.getUint32(46, true); 
	bitmap.infoheader.biClrImportant  = datav.getUint32(50, true);

	var startData = bitmap.fileheader.bfOffBits;  


	if ( bitmap.infoheader.biBitCount == 24 ) {

		bitmap.PC = false;

		bitmap.stride = Math.floor((bitmap.infoheader.biBitCount*bitmap.infoheader.biWidth +31) / 32) * 4;

		bitmap.pixels = new Uint8Array(buffer, startData);					
	} 
	else {

		bitmap.PC = true;

		var numero,
			desplazado, 
			res,
			j = 0,
			k = 0,
			p = 0,
			startPaleta = 54,
			colores = [],
			aux = [];

		if ( bitmap.infoheader.biBitCount == 1 ) {

			var numero, 
				desplazado, 
				res,
				i = 7,
				startPaleta = 54,
				colores = [],
				aux = [],
				mascara = 0x1,        
				data = new Uint8Array(buffer, startData),
				tamData = data.length;

			for ( startPaleta; startPaleta < startData; startPaleta = startPaleta+4 ){
				colores[k] = datav.getUint32(startPaleta,true);
				k++;
			}

			for ( j; j < tamData; j++) {
				numero = data[j];

				for( i; i >= 0; i-- ){
					desplazado = numero >> i;
					res = desplazado & mascara;                                
					aux[p] = colores[res]; // Negro o blanco 
					p++;
				}
				i = 7;
			}
			bitmap.pixels = RGB(aux);
		}

		else if ( bitmap.infoheader.biBitCount == 4 ) {

			var i = 4,
				mascara = 0xF,        
				data = new Uint8Array(buffer, startData),
				tamData = data.length;

			for ( startPaleta; startPaleta < startData; startPaleta = startPaleta+4 ){
				colores[k] = datav.getUint32(startPaleta,true);
				k++;
			}


			for ( j; j < tamData; j++) {
				numero = data[j];

				for( i; i >= 0; i = i - 4 ){
					desplazado = numero >> i;
					res = desplazado & mascara;
					aux[p] = colores[res]; // Negro o blanco 
					p++;
				}
				i = 4;
			}

			bitmap.pixels = RGB(aux);
		}

		else if ( bitmap.infoheader.biBitCount == 8 ) {

			var data = new Uint8Array(buffer, startData),
				tamData = data.length;

			for ( startPaleta; startPaleta < startData; startPaleta = startPaleta+4 ){
				colores[k] = datav.getUint32(startPaleta,true);
				k++;
			}

			for ( j; j < tamData; j++) {
				numero = data[j];
				aux[p] = colores[numero]; // Negro o blanco 
				p++;

			}

		bitmap.pixels = RGB(aux);

		}

		else if ( bitmap.infoheader.biBitCount == 16 ) {

			var i = 4,      
				data = new Uint16Array(buffer, startData),
				tamData = data.length;

			for ( startPaleta; startPaleta < startData; startPaleta = startPaleta+4 ){
				colores[k] = datav.getUint32(startPaleta,true);
				k++;
			}


			for ( j; j < tamData; j++) {
				numero = data[j];
				aux[p] = colores[numero]; // Negro o blanco 
				p++;

			}

		bitmap.pixels = RGB(aux);

		}


	}

	return bitmap; 
}

function convertToImageData(bitmap) { 
	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"); 
	var Width = bitmap.infoheader.biWidth; 
	var Height = bitmap.infoheader.biHeight; 
	var imageData = ctx.createImageData(Width, Height);
	var data = imageData.data;
	var bmpdata = bitmap.pixels; 
	var stride = bitmap.stride;

	if ( bitmap.PC) {

		var index2 = 0;
		for (var y = 0; y < Height; ++y) { 
			for (var x = 0; x < Width; ++x) { 
				var index1 = (x+Width*(Height-y))*4; 

				data[index1] = bmpdata[index2];
				data[index1 + 1] = bmpdata[index2 + 1];
				data[index1 + 2] = bmpdata[index2 + 2];
				data[index1 + 3] = 255; 
				index2 = index2 + 3;
			} 
		}                    
	}
	else {
		for (var y = 0; y < Height; ++y) { 
			for (var x = 0; x < Width; ++x) { 
				var index1 = (x+Width*(Height-y))*4; 
				var index2 = x * 3 + stride * y;
				data[index1] = bmpdata[index2 + 2];
				data[index1 + 1] = bmpdata[index2 + 1];
				data[index1 + 2] = bmpdata[index2];
				data[index1 + 3] = 255;
			} 
		}
	}
	return imageData;
}

function pintar(imagedata, w, h){
	canvas1.width = w;
	canvas1.height= h;
	ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
	ctx1.putImageData(imagedata, 0, 0);

}

function setPixel(imagedata, x, y, r, g, b, a) {
	var i = (y * imagedata.width + x) * 4;
	imagedata.data[i++] = r;
	imagedata.data[i++] = g;
	imagedata.data[i++] = b;
	imagedata.data[i] = a;
}

function getPixel(imagedata, x, y) {
	var i = (y * imagedata.width + x) * 4;
	return {r: imagedata.data[i], g: imagedata.data[i+1], b: imagedata.data[i+2], a: imagedata.data[i+3]};
}

function Negativo(imagedata) {
	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		ImagenNeg = ctx.createImageData(Width, Height);

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = 0 ; x < Width; x++ ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(ImagenNeg, x, y, 255-RGBA.r, 255-RGBA.g, 255-RGBA.b, RGBA.a);
	  }
	}

	Imagen = ImagenNeg;				
	pintar(Imagen,Imagen.width, Imagen.height);
}

function Rotar90D(imagedata) {

	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		p = Height-1,
		Imagen90 = ctx.createImageData(Height,Width);

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = 0 ; x < Width; x++ ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(Imagen90, p, x, RGBA.r, RGBA.g, RGBA.b, RGBA.a);
	  }
		p--;
	}
	Imagen = Imagen90;
	pintar(Imagen,Imagen.height, Imagen.width );
}

function Rotar90I(imagedata) {

	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		p = Width-1,
		Imagen90 = ctx.createImageData(Height,Width);

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = 0 ; x < Width; x++ ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(Imagen90, y, p, RGBA.r, RGBA.g, RGBA.b, RGBA.a);
		  p--;
	  }
		p = Width-1;
	}


	//Imagen = EspejoV(EspejoH(Imagen90));
	Imagen = Imagen90;

	pintar(Imagen,Imagen.height, Imagen.width );
}

function Rotar180(imagedata) {

	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		ImagenEsp = ctx.createImageData(Width, Height);

	imagedata.data = imagedata.data.reverse();

	for ( var i = 0; i < imagedata.data.length; i = i+4 ) {
		a = imagedata.data[i];
		b = imagedata.data[i+1];
		g = imagedata.data[i+2];
		r = imagedata.data[i+3];
		imagedata.data[i] = r;
		imagedata.data[i+1] = g;
		imagedata.data[i+2] = b;
		imagedata.data[i+3] = a;
	}

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = 0 ; x < Width; x++ ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(ImagenEsp, x, y, RGBA.r, RGBA.g, RGBA.b, RGBA.a);
	  }
	}

	Imagen = ImagenEsp;
	pintar(Imagen,Imagen.width, Imagen.height);
}

function EspejoH(imagedata) {

	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		ImagenEsp = ctx.createImageData(Width, Height),
		p = 0;

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = Width-1 ; x >= 0 ; x-- ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(ImagenEsp, p, y, RGBA.r, RGBA.g, RGBA.b, RGBA.a);
		  p++;
	  }
		p = 0;
	}
	Imagen = ImagenEsp;
	pintar(Imagen,Imagen.width, Imagen.height);
}

function EspejoV(imagedata) {

	canvas = document.createElement("canvas"); 
	var ctx = canvas.getContext("2d"),
		Width = canvas1.width,
		Height = canvas1.height,
		p = Height-1,
		ImagenEsp = ctx.createImageData(Width, Height);

	for( var y = 0 ; y < Height; y++ ) {
	  for( var x = 0 ; x < Width; x++ ) {
		  RGBA = getPixel(imagedata,x,y);
		  setPixel(ImagenEsp, x, p, RGBA.r, RGBA.g, RGBA.b, RGBA.a);
	  }
		p--;
	}

	Imagen = ImagenEsp;
	pintar(Imagen,Imagen.width, Imagen.height);
}

function Controlador(opcion) {
	if (opcion == "Negativo") {
		Negativo(Imagen);
	}
	else if (opcion == "EspejoH") {
		EspejoH(Imagen);
	}

	else if (opcion == "EspejoV") {
		EspejoV(Imagen);
	}

}

function RotacionD() {

	var Grado=document.getElementsByName("Grado"),
		opcion;

	for(var i=0;i<Grado.length;i++){

		if(Grado[i].checked)
			opcion=Grado[i].value;
	}

	if(opcion=="90") {

		Rotar90D(Imagen);

	}
	else if (opcion=="180") {
		Rotar180(Imagen);
	}
	else if (opcion=="270") {
		Rotar90I(Imagen);
	}
	pintar(Imagen, Imagen.width, Imagen.height );
}

function RotacionI() {

		var Grado=document.getElementsByName("Grado"),
			opcion;

		for(var i=0;i<Grado.length;i++){

			if(Grado[i].checked)
				opcion=Grado[i].value;
		}

		if(opcion=="90") {

			Rotar90I(Imagen);

		}
		else if (opcion=="180") {
			Rotar180(Imagen);
		}
		else if (opcion=="270") {
			Rotar90D(Imagen);
		}
		pintar(Imagen, Imagen.width, Imagen.height );
	}