import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

// Query de DELETE /usuarios/:id: el administrador siempre elige qué pasa con las publicaciones (D10.6)
export class DeshabilitarUsuarioDto {
  // En la URL llega como texto: "true" / "false"
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'ocultarPublicaciones es obligatorio y debe ser true o false' })
  ocultarPublicaciones: boolean;
}
