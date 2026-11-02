import { Component, inject } from '@angular/core';
import { Modal } from '../../../services/modal';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  host: { '(document:keydown.escape)': 'modal.cerrar(false)' },
})
export class ModalComponent {
  protected modal = inject(Modal);
}
