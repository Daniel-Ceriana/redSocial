import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './services/auth';
import { Nav } from './componentes/compartido/nav/nav';
import { ModalComponent } from './componentes/compartido/modal/modal';

@Component({
  imports: [RouterOutlet, Nav, ModalComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected auth = inject(Auth);
}
