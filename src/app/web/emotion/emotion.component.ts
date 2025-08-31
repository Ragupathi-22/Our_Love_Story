import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { EmotionEntry, EmotionProfile, EmotionProfiles } from '../../models/user-profile.model';
import { EmotionService } from '../../services/emotions/emotion.service';
import { compareDesc, format, isSameMonth, parseISO } from 'date-fns';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeftSquare, ArrowRightSquare ,Eye,EyeOff,Lock} from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-emotion',
  standalone: true,
  templateUrl: './emotion.component.html',
  styleUrls: ['./emotion.component.css'],
  imports: [CommonModule, FormsModule, LucideAngularModule],
})
export class EmotionComponent implements OnInit {
  ArrowLeft = ArrowLeftSquare;
  ArrowRight = ArrowRightSquare;
  Eye=Eye;
  EyeOff=EyeOff;
  Lock=Lock;
  loading = signal(false);
  showPassword=false;
  // === Emoji List ===
  emojis = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '🥺', label: 'Sad' },
    { emoji: '😠', label: 'Angry' },
    { emoji: '😩', label: 'Exhausted' },
  ];

  // === UI Control ===
  tab = signal<any>('log');
  selectedEmoji: { emoji: string; label: string } | null = null;
  note: string = '';
  isLoginMode = signal(true);

  // === Authentication Form ===
  name = '';
  password = '';
  selectedRole: 'he' | 'she' = 'she';

  // === Signals from Service ===
  profile!: WritableSignal<EmotionProfile | null>;
  fullProfiles!: WritableSignal<EmotionProfiles | null>;
  role!: WritableSignal<'he' | 'she' | null>;
  selectedMonth = signal<Date>(this.getPreviousMonth(new Date())); // date-fns
  allEmotionProfiles = signal<EmotionProfiles>({});
  // Store monthly summary data
  monthlySummary = signal<{ [month: string]: { [user in 'he' | 'she']?: { [label: string]: number } } }>({});
  months = signal<{ label: string; value: string }[]>([]); // for sorted UI dropdown / display

  today = format(new Date(), 'MMM dd');

  constructor(public service: EmotionService, private toaster: ToastrService) { }

  ngOnInit(): void {
    this.profile = this.service.emotionData;
    this.fullProfiles = this.service.allEmotionProfiles;
    this.role = this.service.loggedInRole;
    this.loadMonthlySummary();
    this.allEmotionProfiles = this.service.fullProfile;

  }
  selectedMonthKey(): string {
    const date = this.selectedMonth();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getPreviousMonth(date: Date): Date {
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return prevMonth;
  }

  isCurrentOrFutureMonth(date: Date): boolean {
    const today = new Date();
    const selected = new Date(date.getFullYear(), date.getMonth());
    const current = new Date(today.getFullYear(), today.getMonth());

    return selected >= current;
  }

goToPreviousMonth() {
  const current = this.selectedMonth();
  const newMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);

  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 11); // Includes this month as one

  // Prevent going before 1 year ago
  if (newMonth < new Date(oneYearAgo.getFullYear(), oneYearAgo.getMonth(), 1)) return;

  this.selectedMonth.set(newMonth);
}

  goToNextMonth() {
    const current = this.selectedMonth();
    const newMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);

    // Prevent current or future month
    if (this.isCurrentOrFutureMonth(newMonth)) return;

    this.selectedMonth.set(newMonth);
  }
  canGoToNextMonth(): boolean {
    const current = this.selectedMonth();
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    return !this.isCurrentOrFutureMonth(nextMonth);
  }
  getMonthlyLogs(role: 'he' | 'she'): EmotionEntry[] {
    const key = this.selectedMonthKey();
    const allLogs = this.allEmotionProfiles()[role]?.emotions || [];

    return allLogs.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === this.selectedMonth().getFullYear() &&
        entryDate.getMonth() === this.selectedMonth().getMonth()
      );
    });
  }

  getSummary(role: 'he' | 'she') {
    const logs = this.getMonthlyLogs(role);
    const summary: { [emoji: string]: number } = {};

    logs.forEach(log => {
      summary[log.label] = (summary[log.label] || 0) + 1;
    });

    return summary;
  }


  getEmojiCount(role: 'he' | 'she', label: string): number {
    const profile = this.allEmotionProfiles()[role];
    if (!profile) return 0;

    const filtered = profile.emotions.filter(e =>
      isSameMonth(parseISO(e.date), this.selectedMonth()) && e.label === label
    );
    return filtered.length;
  }

  getEmojiPercentage(role: 'he' | 'she', label: string): number {
    const total = this.getMonthlyEmotions(role).length || 1;
    return (this.getEmojiCount(role, label) / total) * 100;
  }

  getMonthlyEmotions(role: 'he' | 'she'): EmotionEntry[] {
    const profile = this.allEmotionProfiles()[role];
    if (!profile) return [];

    return profile.emotions.filter(e =>
      isSameMonth(parseISO(e.date), this.selectedMonth())
    ).sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
  }

  getDisplayName(role: 'he' | 'she'): string {
    const profile = this.allEmotionProfiles()[role];
    return profile?.name || (role === 'he' ? 'He' : 'She');
  }

  async loadMonthlySummary() {

    try {
      const summary = await this.service.getMonthlySummaryGrouped();

      // Populate months list from keys (sorted descending)
      const sortedMonths = Object.keys(summary)
        .sort((a, b) => b.localeCompare(a))
        .map((value) => ({
          value,
          label: new Date(value + '-01').toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          }),
        }));

      this.monthlySummary.set(summary);
      this.months.set(sortedMonths);
    } catch (err) {
      console.error('🔥 ERROR in loadMonthlySummary:', err);
    }
  }


  getEmotionCount(profile: EmotionProfile, label: string, monthValue: string): number {
    const name = profile.name.toLowerCase().includes('he') ? 'he' : 'she';
    const summary = this.monthlySummary();
    console.log(`Count for ${label} in ${monthValue} for ${name}:`, summary[monthValue]?.[name]?.[label]);

    return summary[monthValue]?.[name]?.[label] ?? 0;
  }

  getEmotionPercentage(profile: EmotionProfile, label: string, monthValue: string): number {
    const name = profile.name.toLowerCase().includes('he') ? 'he' : 'she';
    const summary = this.monthlySummary();
    const userData = summary[monthValue]?.[name];

    if (!userData) return 0;

    const total = Object.values(userData).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;

    return (userData[label] / total) * 100;
  }


  // === Login/Register Flow ===
  isLogin() {
    return this.isLoginMode();
  }

  toggleLoginRegister() {
    this.isLoginMode.set(!this.isLoginMode());
  }

  async login() {
    if (!this.name || !this.password) {
      this.toaster.error('Please fill Name and Password');
      return;
    } else {
      try {
        this.loading.set(true);
        const success = await this.service.loginEmotionProfile(this.selectedRole, this.password, this.name);
        if (success) {
          this.name = '';
          this.password = '';
        }
      } finally {
        this.loading.set(false);
      }
    }

  }

  async register() {
    if (!this.name || !this.password) {
      this.toaster.error('Please fill Name and Password');
      return;
    } else {
      try {
        this.loading.set(true);
        await this.service.registerEmotionProfile(this.selectedRole, this.name, this.password);
        this.name = '';
        this.password = '';
        this.selectedRole = 'he';
      } finally {
        this.loading.set(false);
      }
    }

  }

  logout() {
    this.service.logoutEmotion();
  }

  // === Emotion Logging ===
  selectEmoji(emoji: { emoji: string; label: string }) {
    this.selectedEmoji = emoji;
  }

  canAddMoreToday(): boolean {
    const current = this.profile();
    if (!current) return false;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return current.emotions.filter((e) => e.date === todayStr).length < 2;
  }

  getTodayCount(): number {
    const current = this.profile();
    if (!current) return 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return current.emotions.filter((e) => e.date === todayStr).length;
  }

  async submitEmotion() {
    if (!this.canAddMoreToday()) {
      this.toaster.warning("You've shared enough emotion today 💖 See you tomorrow!");
      return;
    }
    if (!this.selectedEmoji) {
      this.toaster.error('Please add an emoji...');
      return;
    }

    if (this.note == '') {
      this.toaster.error('Please add a note..');
      return;
    }


    try {
      this.loading.set(true);
      const entry: EmotionEntry = {
        emoji: this.selectedEmoji.emoji,
        label: this.selectedEmoji.label,
        note: this.note.trim(),
        date: format(new Date(), 'yyyy-MM-dd'),
      };

      await this.service.addEmotionEntry(entry);
      this.note = '';
      this.selectedEmoji = null;

    } finally {
      this.loading.set(false);
    }

  }

  // === Emotion Sorting (History Tab) ===
  // getSortedEmotions(): EmotionEntry[] {
  //   const current = this.profile();
  //   if (!current) return [];

  //   const oneMonthAgo = new Date();
  //   oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  //   return [...current.emotions]
  //     .filter((e) => new Date(e.date) >= oneMonthAgo)
  //     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  // }

  getSortedEmotions(): EmotionEntry[] {
  const current = this.profile();
  if (!current) return [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return [...current.emotions]
    .filter((e) => {
      const date = new Date(e.date);
      return date >= startOfMonth && date <= endOfMonth;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

  // === Monthly Summary ===
  getMonthlyCounts(profile: EmotionProfile | null) {
    const counts: Record<string, number> = {
      Love: 0,
      Happy: 0,
      Sad: 0,
      Angry: 0,
      Overwhelmed: 0,
    };

    if (!profile) return counts;

    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const monthStr = format(prevMonth, 'yyyy-MM');
    profile.emotions.forEach((e) => {
      if (e.date.startsWith(monthStr)) {
        counts[e.label] = (counts[e.label] || 0) + 1;
      }
    });

    return counts;
  }

  get sheSummary() {
    return this.getMonthlyCounts(this.service.getEmotionProfileByRole('she'));
  }

  get heSummary() {
    return this.getMonthlyCounts(this.service.getEmotionProfileByRole('he'));
  }

  getMaxValue(counts: Record<string, number>): number {
    return Math.max(...Object.values(counts));
  }


  getBarWidth(count: number = 0, max: number = 0): string {
    if (!max || isNaN(count)) return '0%';
    const percent = (count / max) * 100;
    return `${percent}%`;
  }


}
