import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LinksService, Link } from './links.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private svc = inject(LinksService);

  urlValue = '';
  links = signal<Link[]>([]);
  newLink = signal<Link | null>(null);
  apiError = signal<string | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.svc.getLinks().subscribe({
      next: (data) => this.links.set(data),
      error: () => {},
    });
  }

  isValid(): boolean {
    return /^https?:\/\/.+/.test(this.urlValue);
  }

  shorten(): void {
    if (!this.isValid()) {
      this.apiError.set('URL must start with http:// or https://');
      this.newLink.set(null);
      return;
    }
    this.loading.set(true);
    this.apiError.set(null);
    this.newLink.set(null);
    this.svc.createLink(this.urlValue).subscribe({
      next: (link) => {
        this.newLink.set(link);
        this.urlValue = '';
        this.loading.set(false);
        this.reload();
      },
      error: (err) => {
        this.apiError.set(err?.error?.error ?? 'Network error — is the backend running?');
        this.loading.set(false);
      },
    });
  }
}
