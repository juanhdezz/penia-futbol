-- Función para obtener información sobre las columnas de una tabla
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  ordinal_position integer
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text,
    c.ordinal_position::integer
  FROM
    information_schema.columns c
  WHERE
    c.table_schema = 'public' AND
    c.table_name = table_name
  ORDER BY
    c.ordinal_position;
END;
$$;

-- Conceder permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO service_role;

-- Comentario para documentar la función
COMMENT ON FUNCTION public.get_table_columns(text) IS 
'Obtiene información detallada sobre las columnas de una tabla específica de la base de datos.
Parámetros:
  - table_name: Nombre de la tabla de la cual se quiere obtener información

Retorna una tabla con las siguientes columnas:
  - column_name: Nombre de la columna
  - data_type: Tipo de dato de la columna
  - is_nullable: Indica si la columna puede ser nula ("YES" o "NO")
  - column_default: Valor predeterminado de la columna (si tiene)
  - ordinal_position: Posición ordinal de la columna en la tabla
';