import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, LoadingController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Users } from './users';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DropdownManagerService } from '../dropdown-manager/dropdown-manager.service';
import { take } from 'rxjs';
import { AdminShellComponent } from '../shared/admin-shell/admin-shell.component';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  status: 'active' | 'inactive' | 'blocked';
  avatar: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule, AdminShellComponent]
})
export class UsersComponent implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'all';
  user: any = null;
  bookings: any[] = [];
  isLoading = true;
  isDetailView = false;
  selectedSegment = 'details';

  statusOptions = [
    { value: 'all', label: 'All Users' }
  ];

  users: User[] = [];

  constructor(private userService: Users,     private route: ActivatedRoute,
    private router:          Router,
    private loadingCtrl:     LoadingController,
    private alertCtrl:       AlertController,
    private dropdownService: DropdownManagerService) { }

  ngOnInit() {
    this.loadDropdownOptions();
    this.userService.getAllUsers().subscribe((res: any) => {
      const rows = this.extractUsers(res);
      this.users = rows.map((row: any) => this.normalizeUser(row));
      this.isLoading = false;
      this.isDetailView = false;
    })
  }

  private loadDropdownOptions() {
    this.dropdownService.getGroupOptions('userStatus').pipe(take(1)).subscribe((opts) => {
      if (opts.length === 0) return;
      this.statusOptions = [
        { value: 'all', label: 'All Users' },
        ...opts.map((opt) => ({ value: opt.value, label: opt.label }))
      ];
    });
  }

  get filteredUsers(): User[] {
    let filtered = this.users;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(u => this.statusCategory(u.status) === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        String(u?.name || '').toLowerCase().includes(query) ||
        String(u?.email || '').toLowerCase().includes(query) ||
        String(u?.phone || '').includes(query)
      );
    }
    return filtered;
  }

  get totalUsersCount(): number {
    return this.users.length;
  }

  get activeUsersCount(): number {
    return this.users.filter((u) => this.statusCategory(u.status) === 'active').length;
  }

  get blockedUsersCount(): number {
    return this.users.filter((u) => this.statusCategory(u.status) === 'blocked').length;
  }

  get pendingUsersCount(): number {
    return this.users.filter((u) => this.statusCategory(u.status) === 'pending').length;
  }


  async viewUser(id: any) {
    const loading = await this.loadingCtrl.create({ message: 'Loading...' });
    await loading.present();

    this.userService.getUserById(id).subscribe({
      next: (res: any) => {
        loading.dismiss();
        this.isLoading = false;
        const data = res?.data?.data || res?.data || res;
        const user = data?.user || data;
        const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
        if (user) {
          this.user     = user;
          this.bookings = bookings;
          this.isDetailView = true;
        }
      },
      error: () => {
        loading.dismiss();
        this.isLoading = false;
        this.isDetailView = false;
      }
    });
  }

  async confirmBlock(user: any) {
    const alert = await this.alertCtrl.create({
      header:  'Block User',
      message: `Are you sure you want to block ${user.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Block',
          role: 'destructive',
          handler: () => this.blockUser(user)
        }
      ]
    });
    await alert.present();
  }

  blockUser(user: any) {
    this.userService.blockUser(user.id).subscribe((res: any) => {
      if (res.response) {
        this.user.status = 'blocked';
      }
    });
  }

  activateUser(user: any) {
    this.userService.activateUser(user.id).subscribe((res: any) => {
      if (res.response) {
        this.user.status = 'active';
      }
    });
  }

  getAvatar(user: any) {
    return user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=667eea&color=fff&size=128`;
  }

  getStatusColor(status: string) {
    return status === 'active' ? 'success' : status === 'blocked' ? 'danger' : 'medium';
  }

  getBookingStatusColor(status: string) {
    const map: any = { confirmed: 'success', pending: 'warning', cancelled: 'danger', completed: 'primary' };
    return map[status] || 'medium';
  }

  goBack(){
    this.isDetailView = false;
    this.isLoading = false;
    this.selectedSegment = 'details';
    this.user = null;
    this.bookings = [];
  }

  private normalizeUser(row: any): User {
    const status = this.resolveStatus(row);
    return {
      ...row,
      id: Number(row?.id || 0),
      name: row?.name || row?.full_name || '-',
      email: row?.email || '-',
      phone: row?.phone || row?.phone_number || '-',
      joinDate: row?.joinDate || row?.created_at || row?.createdAt || '-',
      totalBookings: Number(row?.totalBookings ?? row?.total_bookings ?? 0),
      totalSpent: Number(row?.totalSpent ?? row?.total_spent ?? 0),
      status,
      avatar: row?.avatar || '',
    };
  }

  private resolveStatus(row: any): 'active' | 'inactive' | 'blocked' {
    const status = String(row?.status || '').toLowerCase();
    if (status === 'active') return 'active';
    if (status === 'blocked') return 'blocked';
    if (status === 'inactive' || status === 'pending') return 'inactive';

    const isActive = row?.is_active ?? row?.isActive;
    if (isActive === 1 || isActive === true || isActive === '1') return 'active';
    if (isActive === 0 || isActive === false || isActive === '0') return 'inactive';

    return 'inactive';
  }

  private statusCategory(status: string): 'active' | 'blocked' | 'pending' {
    const value = String(status || '').toLowerCase();
    if (value === 'active') return 'active';
    if (value === 'blocked') return 'blocked';
    return 'pending';
  }

  private extractUsers(res: any): any[] {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.users)) return res.data.users;
    if (Array.isArray(res?.users)) return res.users;
    if (Array.isArray(res)) return res;
    return [];
  }

}
