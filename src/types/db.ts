// Tipos de la base de datos (instancia externa de Supabase).
//
// Placeholder permisivo hasta regenerar los tipos reales con:
//   supabase gen types typescript --linked > src/types/db.ts
export type Json = any;

type AnyRow = { [key: string]: any };

type AnyTable = {
  Row: AnyRow;
  Insert: AnyRow;
  Update: AnyRow;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: { [key: string]: AnyTable };
    Views: { [key: string]: { Row: AnyRow; Relationships: [] } };
    Functions: { [key: string]: { Args: AnyRow; Returns: any } };
    Enums: { [key: string]: string };
    CompositeTypes: { [key: string]: AnyRow };
  };
};
