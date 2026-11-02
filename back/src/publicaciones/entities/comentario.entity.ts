import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comentario {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Publicacion', required: true })
  publicacion: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 300 })
  mensaje: string;

  // Pasa a true cuando el autor edita el mensaje (S7)
  @Prop({ default: false })
  modificado: boolean;

  // Baja lógica
  @Prop({ default: true })
  activo: boolean;
}

export type ComentarioDocument = HydratedDocument<Comentario>;
export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
ComentarioSchema.index({ publicacion: 1, activo: 1, createdAt: -1 });
