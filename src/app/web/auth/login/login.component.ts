import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  styleUrl: './login.component.css',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;

  hearts: any[] = [];
  bokeh: any[] = [];

  constructor(private auth: AuthService, private router: Router, private toastr: ToastrService,) {
    this.generateFloatingHearts();
    this.generateBokehCircles();
  }

  async login() {
    if(!this.email || !this.password) {
      this.toastr.error('Almost there! Just need both heartbeats — email and password 💑');
      return;
    }
    this.isLoading = true;
    try {
      await this.auth.login(this.email, this.password);
      this.toastr.success('Welcome back ❤️', 'Login successful');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error(error);
      let message = 'Login failed!';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-credential') {
       message = 'Invalid credentials provided.';
      }
      this.toastr.error(message, 'Authentication Error');
    } finally {
      this.isLoading = false;
    }
  }

  async forgotPassword() {
    if (!this.email) {
      this.toastr.warning('Please enter your email to reset password', 'Missing Email');
      return;
    }

    try {
      await this.auth.forgotPassword(this.email);
      this.toastr.success('Password reset link sent to your email!', 'Check Inbox');
    } catch (error: any) {
      console.error(error);
      let message = 'Failed to send reset link.';
      if (error.code === 'auth/user-not-found') {
        message = 'No user registered with this email.';
      }
      this.toastr.error(message, 'Reset Failed');
    }
  }
  
  private generateFloatingHearts() {
    this.hearts = Array.from({ length: 20 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${3 + Math.random() * 2}s`
    }));
  }

  private generateBokehCircles() {
    this.bokeh = Array.from({ length: 8 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      width: `${100 + Math.random() * 200}px`,
      height: `${100 + Math.random() * 200}px`,
      delay: `${Math.random() * 2}s`,
      duration: `${4 + Math.random() * 2}s`
    }));
  }
}
