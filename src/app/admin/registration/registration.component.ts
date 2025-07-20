import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Auth,
  createUserWithEmailAndPassword,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  collection,
  getDocs,
} from '@angular/fire/firestore';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
  ],
})
export class RegistrationComponent {
  registerForm: FormGroup;
  btnHitter = false;
  yesterday: string | undefined;

  // Subscription verification
  subscriptionKey = '';
  isSubscriptionVerified = false;
  isVerifyingSubscription = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registerForm = this.fb.group({
      yourName: ['', Validators.required],
      partnerName: ['', Validators.required],
      yourDob: ['', Validators.required],
      partnerDob: ['', Validators.required],
      loveStartDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit() {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    this.yesterday = today.toISOString().split('T')[0];
  }

  isInvalid(control: string): boolean {
    const ctrl = this.registerForm.get(control);
    return ctrl?.invalid && (ctrl?.dirty || ctrl?.touched) || false;
  }

  async verifySubscription() {
    if (!this.subscriptionKey.trim()) {
      this.toastr.warning('Please enter your subscription key');
      return;
    }

    this.isVerifyingSubscription = true;

    try {
      const snapshot = await getDocs(collection(this.firestore, 'subscriptions'));
      const matched = snapshot.docs.some(
        (doc) => doc.data()['key'] === this.subscriptionKey.trim()
      );

      if (matched) {
        this.isSubscriptionVerified = true;
        this.toastr.success('Subscription key verified!');
      } else {
        this.toastr.error('Invalid subscription key!');
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      this.toastr.error('Error verifying subscription. Try again later.');
    } finally {
      this.isVerifyingSubscription = false;
    }
  }

  async onSubmit() {

    if (!this.isSubscriptionVerified) {
      this.toastr.warning('Please verify your subscription first!');
      this.btnHitter = false;
      return;
    }

    if (this.registerForm.valid) {
      const {
        email,
        password,
        yourName,
        partnerName,
        yourDob,
        partnerDob,
        loveStartDate,
      } = this.registerForm.value;

      // Show confirmation popup
      const result = await Swal.fire({
        title: 'Are you sure ?',
        html: `
    <p>Please take a moment to review everything one last time.</p>
    <p class="mt-2 text-pink-600 font-semibold">Once submitted, it cannot be edited again. 🖋️</p>
    <p class="mt-1 italic">These memories will be part of our forever story. 💖</p>
  `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e91e63', // soft pink
        cancelButtonColor: '#9e9e9e',  // gray
        confirmButtonText: 'Yes, I’m sure ❤️',
        cancelButtonText: 'Let me check again 📝',
      });

      if (result.isConfirmed) {
        this.btnHitter = true;

        try {
          const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
          const uid = userCredential.user.uid;

          const userDoc = doc(this.firestore, 'users', uid);
          await setDoc(userDoc, {
            uid,
            email,
            yourName,
            partnerName,
            yourDob,
            partnerDob,
            loveStartDate,
            subscriptionKey: this.subscriptionKey.trim(), // ✅ Store it
            createdAt: new Date(),
            timeline: [],
            gallery: [],
            playlistUrl: [],
          });

          this.toastr.success('Registration successful!', 'Welcome');
          this.router.navigate(['/admin/layout']);
        } catch (error: any) {
          console.error('Registration failed:', error);
          let message = 'Registration failed. Please try again later.';
          switch (error.code) {
            case 'auth/email-already-in-use':
              message = 'This email is already registered. Please log in or use another.';
              break;
            case 'auth/invalid-email':
              message = 'The email address is invalid.';
              break;
            case 'auth/operation-not-allowed':
              message = 'Email/password sign-in is disabled. Contact support.';
              break;
            case 'auth/weak-password':
              message = 'Password is too weak. Use at least 6 characters.';
              break;
          }
          this.toastr.error(message, 'Registration Failed');
        } finally {
          this.btnHitter = false;
        }
      }

    } else {
      this.btnHitter = false;
      this.registerForm.markAllAsTouched();
      this.toastr.warning('Please complete all required fields.', 'Validation Error');
    }

  }
}
