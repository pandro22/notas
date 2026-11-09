// Limpia el texto del buscador. Se usa en dos sitios (consulta y resaltado) y debe ser
// SIEMPRE la misma función, para que lo que se busca y lo que se resalta coincidan.
//
// Sustituye por espacios los caracteres con significado en la sintaxis de filtros de
// PostgREST (coma, paréntesis, comillas, comodines...) para que el texto no pueda alterar
// la consulta. La seguridad real la da RLS; esto evita filtros manipulados.
export function sanitizeTerm(term: string): string {
  return term.replace(/[%_*,()"'\\.:]/g, ' ').trim();
}
