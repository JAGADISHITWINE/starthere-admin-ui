import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Users } from './users';
import { RouterModule } from '@angular/router';

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
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class UsersComponent implements OnInit {
  searchQuery: string = '';
  selectedStatus: string = 'all';

  statusOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blocked', label: 'Blocked' }
  ];

  users: User[] = [];

  constructor(private userService: Users) { }

  ngOnInit() {
    this.userService.getAllUsers().subscribe((res: any) => {
      this.users = res.data;
    })
  }

  get filteredUsers(): User[] {
    let filtered = this.users;

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(u => u.status === this.selectedStatus);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    }

    return filtered;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      default: return 'medium';
    }
  }

  getAvatar(user: User): string {
    if (user.avatar) {
      return user.avatar;
    }

    // fallback → initials avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=random`;
  }


  async viewUser(id: number) {
    console.log('View user:', id);
  }

  async blockUser(user: User) {
    user.status = 'blocked';
  }

  async activateUser(user: User) {
    user.status = 'active';
  }

}
