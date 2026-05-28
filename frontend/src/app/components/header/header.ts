import { ChangeDetectionStrategy, Component, inject, signal, computed, HostListener, OnInit, DestroyRef } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ZardButtonComponent } from '../../shared/components/button';
import { ZardBadgeComponent } from '../../shared/components/badge';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, ZardButtonComponent, ZardBadgeComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  readonly menuOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly activePageLabel = computed(() => {
    const url = this.currentUrl();
    const currentPath = url.split('?')[0];
    const navItems = this.authService.navigation();
    const matchingNavItem = navItems.find((item) => currentPath.startsWith(item.path));
    return matchingNavItem ? matchingNavItem.label : 'KitchenFlow';
  });

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollOffset = window.scrollY || document.documentElement.scrollTop || 0;
    this.isScrolled.set(scrollOffset > 25);
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.authService.logout(this.router);
    this.closeMenu();
  }
}


