import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ required: true, trim: true, maxlength: 100 })
  titulo: string;

  @Prop({ default: '', trim: true, maxlength: 500 })
  descripcion: string;

  // URL de la imagen en Cloudinary (vacía si no tiene)
  @Prop({ default: '' })
  imagen: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  // Usuarios que dieron me gusta; cantidadMeGusta se mantiene junto con el arreglo para poder ordenar
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Usuario' }], default: [] })
  meGusta: Types.ObjectId[];

  @Prop({ default: 0 })
  cantidadMeGusta: number;

  // Baja lógica
  @Prop({ default: true })
  activa: boolean;
}

export type PublicacionDocument = HydratedDocument<Publicacion>;
export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
PublicacionSchema.index({ activa: 1, createdAt: -1 });
PublicacionSchema.index({ activa: 1, cantidadMeGusta: -1, createdAt: -1 });
PublicacionSchema.index({ autor: 1, createdAt: -1 });
