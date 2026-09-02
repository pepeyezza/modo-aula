// El "toggle" es el ícono de la marca MODO: una pastilla con un círculo,
// como un interruptor encendido. Se usa junto a la palabra "MODO" en el
// isologo (ver esquema de marcas) y solo, en tamaño chico, como acento.
// El color lo hereda del texto (currentColor) para poder reusarlo tanto
// en teal (MODO Aula) como en blanco (sobre fondos oscuros) sin duplicar
// el SVG.
export function ModoToggleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 18" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="32" height="18" rx="9" fill="currentColor" />
      <circle cx="22" cy="9" r="6.5" fill="white" />
    </svg>
  );
}
