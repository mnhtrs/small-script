let jspdf = document.createElement("script");
jspdf.onload = () => {
	let pdf = new jsPDF();
	let elements = document.getElementsByTagName("img");
	for(let i in elements){
		let img = elements[i];
		if (!/^blob:/.test(img.src)) continue;
		let cvs = document.createElement("canvas");
		let ctx = cvs.getContext("2d");
		cvs.width = img.width;
		cvs.height = img.height;
		ctx.drawImage(img, 0, 0,img.width, img.height);
		pdf.addImage(cvs.toDataURL("image/jpeg", 1.0), 'JPEG', 0, 0);
		pdf.addPage();
	}
	pdf.save( "download.pdf" );
}
jspdf.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.3.2/jspdf.min.js' ;
document.body.appendChild(jspdf);
