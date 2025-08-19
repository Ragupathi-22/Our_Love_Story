import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmModalComponent } from "./components/confirmation_model/confirmation_model";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Soulprints';
}
