import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { UsuariosService } from './usuarios/usuarios.service.js';
import { Perfil } from './usuarios/entities/usuario.entity.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const CUENTAS: {
  perfil: Perfil;
  clave: string;
  correo: string;
  nombreUsuario: string;
  nombre: string;
}[] = [
  { perfil: 'usuario', clave: 'USUARIO', correo: 'usuario@trochita.com', nombreUsuario: 'maquinista', nombre: 'Usuario' },
  { perfil: 'administrador', clave: 'ADMIN', correo: 'admin@trochita.com', nombreUsuario: 'jefe_de_estacion', nombre: 'Administrador' },
];

// Crea (si no existen) las cuentas de los botones de acceso rápido. Se puede correr las veces que haga falta.
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const config = app.get(ConfigService);
  const usuarios = app.get(UsuariosService);
  const imagenPerfil = config.get<string>('IMAGEN_PERFIL_DEFECTO', '');

  for (const cuenta of CUENTAS) {
    const correo = config.get<string>(`SEED_${cuenta.clave}_CORREO`, cuenta.correo);
    const contrasena = config.get<string>(`SEED_${cuenta.clave}_CONTRASENA`, 'Trochita123');
    try {
      await usuarios.verificarDisponibles(correo, cuenta.nombreUsuario);
    } catch {
      console.log(`Ya existe: ${correo}`);
      continue;
    }
    await usuarios.crear(
      {
        nombre: cuenta.nombre,
        apellido: 'La Trochita',
        correo,
        nombreUsuario: cuenta.nombreUsuario,
        contrasena,
        fechaNacimiento: '2000-01-01',
        descripcion: `Cuenta de ${cuenta.perfil} para pruebas`,
        imagenPerfil,
      },
      cuenta.perfil,
    );
    console.log(`Creado: ${correo} (${cuenta.perfil})`);
  }
  await app.close();
}
await seed();
