// "2000-05-10" -> "10/05/2000" (se arma a mano para que la zona horaria no corra el día)
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

// Fecha de hoy menos `anios` años, como AAAA-MM-DD (hora local de Argentina en el navegador)
export function fechaHaceAnios(anios: number): string {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear() - anios, hoy.getMonth(), hoy.getDate());
  return aTextoFecha(fecha);
}

export function aTextoFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}
