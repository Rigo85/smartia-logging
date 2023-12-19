export function revertEscapedString(escapedString: string): string {
	// Reemplazar las secuencias de escape de las comillas dobles
	let originalString = escapedString.replace(/\\"/g, "\"");

	// Reemplazar o eliminar las secuencias de escape ANSI (colores)
	// Aquí simplemente las estamos eliminando, ajusta según sea necesario
	originalString = originalString.replace(/\u001b\[\d+m/g, "");

	return originalString;
}
